/**
 * Eligibility Wizard Block for Adobe EDS
 * Recreates OPAF Eligibility Tool functionality with authoring support
 */

// Geolocation configuration
const GEO_CONFIG = {
  allowedCountries: ['US', 'PR'],
  outsideRegionMessage: `
    <h3>We've detected that you're currently outside of the United States/Puerto Rico.</h3>
    <p>Assistance from the Otsuka Patient Assistance Foundation, Inc. (OPAF) is available only to residents of the US/Puerto Rico.</p>
    <p>If you're in the US/Puerto Rico, or are checking on behalf of a resident of a US/Puerto Rico, you can <a href="#start-check" id="geolocate-bypass">start the eligibility verification process.</a></p>
  `,
};

/**
 * Get user's country code from Akamai/CDN geo headers or fallback methods
 * @returns {Promise<string>} Two-letter country code (e.g., 'US', 'PR', 'JP')
 */
async function getUserCountryCode() {
  // Method 1: Check for AEM/Akamai edge headers via a lightweight request
  try {
    const response = await fetch(window.location.href, {
      method: 'HEAD',
      cache: 'no-store',
    });
    // Check common CDN geo headers
    const countryCode = response.headers.get('x-akamai-edgescape')?.match(/country_code=(\w{2})/)?.[1]
      || response.headers.get('cf-ipcountry') // Cloudflare
      || response.headers.get('x-vercel-ip-country') // Vercel
      || response.headers.get('x-geo-country'); // Custom header

    if (countryCode) {
      return countryCode.toUpperCase();
    }
  } catch (e) {
    // Silently fail and try next method
  }

  // Method 2: Use a free geolocation API as fallback
  try {
    const response = await fetch('https://ipapi.co/country/', { cache: 'no-store' });
    if (response.ok) {
      const countryCode = await response.text();
      return countryCode.trim().toUpperCase();
    }
  } catch (e) {
    // Silently fail
  }

  // Default to allowing access if geolocation fails
  return 'US';
}

/**
 * Check if user is in an allowed region
 * @param {string} countryCode - Two-letter country code
 * @returns {boolean} True if user is in allowed region
 */
function isInAllowedRegion(countryCode) {
  return GEO_CONFIG.allowedCountries.includes(countryCode);
}

// Federal Poverty Level data (2024 - update annually)
const FPL_DATA = {
  1: 15060,
  2: 20440,
  3: 25820,
  4: 31200,
  5: 36580,
  6: 41960,
  7: 47340,
  8: 52720,
};

// Calculate FPL for household size (extrapolate for >8)
function getFPL(householdSize) {
  if (householdSize <= 8) {
    return FPL_DATA[householdSize];
  }
  // For each additional person, add increment
  const increment = 5140;
  return FPL_DATA[8] + ((householdSize - 8) * increment);
}

// Calculate annual income from different frequencies
function calculateAnnualIncome(amount, frequency) {
  const cleanAmount = parseFloat(amount.replace(/[^0-9.]/g, ''));
  if (Number.isNaN(cleanAmount)) return 0;

  switch (frequency) {
    case 'weekly':
      return cleanAmount * 52;
    case 'monthly':
      return cleanAmount * 12;
    case 'annually':
    default:
      return cleanAmount;
  }
}

// Calculate FPL percentage
function calculateFPLPercentage(annualIncome, householdSize) {
  const fpl = getFPL(householdSize);
  return (annualIncome / fpl) * 100;
}

// Wizard state management
class EligibilityWizard {
  constructor(block, config) {
    this.block = block;
    this.config = config;
    this.currentStepIndex = 0;
    this.isOutsideRegion = false;
    this.geoCheckComplete = false;
    this.data = {
      medication: null,
      medicationSpecialTag: null,
      insurance: null,
      insuranceCoverage: null,
      householdSize: null,
      income: null,
      incomeFrequency: null,
      annualIncome: null,
      fplPercentage: null,
    };
    this.steps = [];
    this.options = {};
    this.results = {};
  }

  async init() {
    // Check geolocation first
    await this.checkGeolocation();
    this.render();
  }

  async checkGeolocation() {
    try {
      const countryCode = await getUserCountryCode();
      this.isOutsideRegion = !isInAllowedRegion(countryCode);
      this.geoCheckComplete = true;
    } catch (e) {
      // If geo check fails, allow access
      this.isOutsideRegion = false;
      this.geoCheckComplete = true;
    }
  }

  bypassGeoBlock() {
    this.isOutsideRegion = false;
    const geoBlockMessage = this.block.querySelector('.geo-block-message');
    if (geoBlockMessage) {
      geoBlockMessage.classList.add('wizard-hidden');
    }
    const wizardForm = this.block.querySelector('.wizard-form');
    if (wizardForm) {
      wizardForm.classList.remove('wizard-hidden');
    }
    // Show first step
    this.updateUI();
  }

  getCurrentStep() {
    return this.steps[this.currentStepIndex];
  }

  getStepByIndex(index) {
    return this.steps[index];
  }

  getStepById(stepId) {
    return this.steps.find((step) => step.stepId === stepId);
  }

  navigateToStep(stepId) {
    const stepIndex = this.steps.findIndex((s) => s.stepId === stepId);
    if (stepIndex !== -1) {
      this.currentStepIndex = stepIndex;
      this.updateUI();
    }
  }

  nextStep() {
    // Validate current step
    if (!this.validateCurrentStep()) {
      return;
    }

    // Determine next step based on current data
    const nextStepId = this.determineNextStep();

    if (nextStepId === 'results') {
      this.showResults();
    } else if (nextStepId) {
      this.navigateToStep(nextStepId);
    } else if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex += 1;
      this.updateUI();
    }
  }

  prevStep() {
    if (this.currentStepIndex > 0) {
      // Clear inputs on current step before going back
      this.clearCurrentStepInputs();

      this.currentStepIndex -= 1;
      this.updateUI();
    }
  }

  clearCurrentStepInputs() {
    const currentStep = this.getCurrentStep();
    const stepContainer = this.block.querySelector(`[data-step-id="${currentStep.stepId}"]`);

    if (!stepContainer) return;

    // Clear select elements
    const selects = stepContainer.querySelectorAll('select');
    selects.forEach((select) => {
      select.value = '';
    });

    // Clear text inputs
    const textInputs = stepContainer.querySelectorAll('input[type="text"]');
    textInputs.forEach((input) => {
      input.value = '';
    });

    // Clear radio buttons
    const radios = stepContainer.querySelectorAll('input[type="radio"]');
    radios.forEach((radio) => {
      radio.checked = false;
    });

    // Clear checkboxes
    const checkboxes = stepContainer.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
      checkbox.checked = false;
    });

    // Hide sub-options if visible (e.g., commercial insurance coverage)
    const subOptions = stepContainer.querySelector('.selection-screen-internal');
    if (subOptions) {
      subOptions.classList.add('wizard-hidden');
    }

    // Clear data for this step
    if (currentStep.stepId === 'medication') {
      this.data.medication = null;
      this.data.medicationSpecialTag = null;
    } else if (currentStep.stepId === 'insurance') {
      this.data.insurance = null;
      this.data.insuranceCoverage = null;
    } else if (currentStep.stepId === 'household') {
      this.data.householdSize = null;
    } else if (currentStep.stepId === 'income') {
      this.data.income = null;
      this.data.incomeFrequency = null;
      this.data.annualIncome = null;
      this.data.fplPercentage = null;
    }

    // Disable next button since inputs are cleared
    const nextButton = stepContainer.querySelector('.btn-next');
    if (nextButton) {
      nextButton.classList.add('disabled');
    }

    // Remove any error messages
    const errorMessages = stepContainer.querySelectorAll('.error-message.visible');
    errorMessages.forEach((error) => {
      error.classList.remove('visible');
    });
  }

  validateCurrentStep() {
    const step = this.getCurrentStep();
    const stepContainer = this.block.querySelector(`[data-step-id="${step.stepId}"]`);

    if (!stepContainer) return false;

    // Remove previous error messages
    stepContainer.querySelectorAll('.error-message').forEach((el) => el.classList.remove('visible'));

    switch (step.stepType) {
      case 'select': {
        const select = stepContainer.querySelector('select');
        if (!select?.value) {
          this.showError(stepContainer, 'Please make a selection');
          return false;
        }
        break;
      }
      case 'input-number': {
        const input = stepContainer.querySelector('input[type="text"]');
        const value = parseInt(input?.value || '0', 10);
        const min = step.minValue || 1;
        const max = step.maxValue || 100;

        if (!value || value < min || value > max) {
          this.showError(stepContainer, `Please enter a number between ${min} and ${max}`);
          return false;
        }
        break;
      }
      case 'input-currency': {
        const input = stepContainer.querySelector('input[type="text"]');
        const frequency = stepContainer.querySelector('input[type="radio"]:checked');

        if (!input?.value || !frequency) {
          this.showError(stepContainer, 'Please enter income and select frequency');
          return false;
        }
        break;
      }
      default:
        break;
    }

    return true;
  }

  // eslint-disable-next-line class-methods-use-this
  showError(container, message) {
    let errorDiv = container.querySelector('.error-message');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
    }
    errorDiv.className = 'error-message visible';
    errorDiv.textContent = message;

    if (!errorDiv.parentNode) {
      const inputGroup = container.querySelector('.input-group, .select-wrapper');
      if (inputGroup) {
        inputGroup.appendChild(errorDiv);
      }
    }
  }

  determineNextStep() {
    const currentStep = this.getCurrentStep();

    switch (currentStep.stepId) {
      case 'medication': {
        const selectedOption = this.options.medication?.find(
          (opt) => opt.optionValue === this.data.medication,
        );
        if (selectedOption?.resultId) {
          return 'results';
        }
        return selectedOption?.nextStepId || 'insurance';
      }
      case 'insurance': {
        if (this.data.insurance === 'commercial') {
          // If commercial and approved, skip to results
          if (this.data.insuranceCoverage === 'yes') {
            return 'results';
          }
          // Otherwise continue to household
          return 'household';
        }
        return 'household';
      }
      case 'household':
        return 'income';
      case 'income':
        return 'results';
      default:
        return null;
    }
  }

  captureStepData(stepId) {
    const stepContainer = this.block.querySelector(`[data-step-id="${stepId}"]`);
    if (!stepContainer) return;

    const step = this.getStepById(stepId);

    switch (step.stepType) {
      case 'select': {
        const select = stepContainer.querySelector('select');
        if (stepId === 'medication') {
          this.data.medication = select?.value;
          const option = this.options.medication?.find((opt) => opt.optionValue === select?.value);
          this.data.medicationSpecialTag = option?.specialTag;
        } else if (stepId === 'insurance') {
          this.data.insurance = select?.value;
        }
        break;
      }
      case 'input-number': {
        const input = stepContainer.querySelector('input[type="text"]');
        if (stepId === 'household') {
          this.data.householdSize = parseInt(input?.value || '0', 10);
        }
        break;
      }
      case 'input-currency': {
        const input = stepContainer.querySelector('input[type="text"]');
        const frequency = stepContainer.querySelector('input[type="radio"]:checked');

        if (stepId === 'income') {
          this.data.income = input?.value;
          this.data.incomeFrequency = frequency?.value;
          this.data.annualIncome = calculateAnnualIncome(
            this.data.income,
            this.data.incomeFrequency,
          );
          this.data.fplPercentage = calculateFPLPercentage(
            this.data.annualIncome,
            this.data.householdSize,
          );
        }
        break;
      }
      default:
        break;
    }
  }

  determineResultId() {
    // Logic to determine which result to show
    // Based on medication, insurance, and income

    // Check for immediate disqualifiers
    if (this.data.medication === 'no_prescription') {
      return 'no-prescription';
    }

    if (this.data.medication === 'med_not_listed') {
      return 'med-not-listed';
    }

    if (this.data.insurance === 'commercial' && this.data.insuranceCoverage === 'yes') {
      return 'already-covered';
    }

    // Check income against FPL threshold
    const threshold = this.config.fplThresholdPercent || 500;

    if (this.data.fplPercentage > threshold) {
      return 'income-fails';
    }

    // Eligible scenarios
    if (this.data.insurance === 'commercial' && this.data.insuranceCoverage === 'unsure') {
      return 'income-passes-unsure';
    }

    // Check for special medication handling
    if (['nuedexta', 'abilifyasimtufii'].includes(this.data.medicationSpecialTag)) {
      return 'income-passes-nd-aa';
    }

    if (this.data.medicationSpecialTag === 'jynarque') {
      return 'jynarque-eligible';
    }

    return 'income-passes';
  }

  showResults() {
    const resultId = this.determineResultId();
    const result = this.results[resultId];

    if (!result) {
      // Result not found - log error silently
      return;
    }

    // Hide all wizard screens
    this.block.querySelectorAll('.selection-screen').forEach((el) => {
      if (el.id !== 'eligibility-wizard-results') {
        el.classList.add('wizard-hidden');
      }
    });

    // Hide all result permutations first
    this.block.querySelectorAll('.result-permutation').forEach((el) => {
      el.classList.add('wizard-hidden');
    });

    // Show the specific result
    const resultDiv = this.block.querySelector(`#results-${resultId}`);
    if (resultDiv) {
      resultDiv.classList.remove('wizard-hidden');
    }

    // Show results screen
    const resultsContainer = this.block.querySelector('#eligibility-wizard-results');
    resultsContainer.classList.remove('wizard-hidden');

    // Mark all progress indicators as completed
    this.block.querySelectorAll('.selection-progress-wrapper').forEach((indicator) => {
      indicator.classList.remove('state-current');
      indicator.classList.add('state-completed');
    });

    // Scroll to top
    this.block.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  restart() {
    this.currentStepIndex = 0;
    this.data = {
      medication: null,
      medicationSpecialTag: null,
      insurance: null,
      insuranceCoverage: null,
      householdSize: null,
      income: null,
      incomeFrequency: null,
      annualIncome: null,
      fplPercentage: null,
    };

    // Reset all inputs
    this.block.querySelectorAll('input, select').forEach((el) => {
      el.value = '';
      if (el.type === 'radio' || el.type === 'checkbox') {
        el.checked = false;
      }
    });

    // Hide results and all result permutations
    this.block.querySelector('#eligibility-wizard-results')?.classList.add('wizard-hidden');
    this.block.querySelectorAll('.result-permutation').forEach((el) => {
      el.classList.add('wizard-hidden');
    });

    // Disable all next buttons until selection is made
    this.block.querySelectorAll('.btn-next').forEach((btn) => {
      btn.classList.add('disabled');
    });

    // Show first step
    this.updateUI();
  }

  updateUI() {
    // Capture data from current step before moving
    const currentStep = this.getCurrentStep();
    if (currentStep) {
      this.captureStepData(currentStep.stepId);
    }

    // Hide all steps
    this.block.querySelectorAll('.selection-screen').forEach((step) => {
      step.classList.add('wizard-hidden');
    });

    // Show current step
    const stepToShow = this.getCurrentStep();
    const stepElement = this.block.querySelector(`[data-step-id="${stepToShow.stepId}"]`);
    if (stepElement) {
      stepElement.classList.remove('wizard-hidden');
    }

    // Update progress indicators
    this.updateProgressIndicators();

    // Update button states
    this.updateNavigationButtons();
  }

  updateProgressIndicators() {
    this.block.querySelectorAll('.selection-progress-wrapper').forEach((indicator, index) => {
      indicator.classList.remove('state-current', 'state-completed');

      // Don't show any current state if user is outside region (geo-blocked)
      if (this.isOutsideRegion) {
        return;
      }

      if (index < this.currentStepIndex) {
        indicator.classList.add('state-completed');
      } else if (index === this.currentStepIndex) {
        indicator.classList.add('state-current');
      }
    });
  }

  updateNavigationButtons() {
    const currentStep = this.getCurrentStep();
    const stepContainer = this.block.querySelector(`[data-step-id="${currentStep.stepId}"]`);

    if (!stepContainer) return;

    const prevButton = stepContainer.querySelector('.btn-prev');

    // Update prev button
    if (prevButton) {
      if (this.currentStepIndex === 0) {
        prevButton.classList.add('disabled');
      } else {
        prevButton.classList.remove('disabled');
      }
    }

    // Next button is enabled/disabled based on validation
    // This will be handled by input change events
  }

  renderProgressIndicator() {
    const progressDiv = document.createElement('div');
    progressDiv.className = 'wizard-progress';

    this.steps.forEach((step, index) => {
      if (step.stepId === 'results') return; // Don't show results in progress

      const stepDiv = document.createElement('div');
      stepDiv.className = `selection-progress-wrapper status-${step.stepId}`;

      if (index === 0) stepDiv.classList.add('first');
      if (index === this.steps.length - 2) stepDiv.classList.add('last');
      if (index === this.currentStepIndex) stepDiv.classList.add('state-current');

      stepDiv.innerHTML = `
        <label for="input-${step.stepId}">
          <span class="title">${step.stepLabel}</span>
          <span class="sr-only">Selected</span>
        </label>
        <input type="checkbox" value="${step.stepId}" name="input-${step.stepId}" 
               id="input-${step.stepId}" tabindex="-1">
      `;

      progressDiv.appendChild(stepDiv);
    });

    return progressDiv;
  }

  renderStep(step) {
    const stepDiv = document.createElement('div');
    stepDiv.className = `selection-screen ${this.currentStepIndex === this.steps.indexOf(step) ? '' : 'wizard-hidden'}`;
    stepDiv.setAttribute('data-step-id', step.stepId);
    stepDiv.setAttribute('data-screen', this.steps.indexOf(step).toString());
    stepDiv.id = `selection-${step.stepId}`;

    // Render step content based on type
    switch (step.stepType) {
      case 'select':
        stepDiv.appendChild(this.renderSelect(step));
        break;
      case 'input-number':
        stepDiv.appendChild(this.renderNumberInput(step));
        break;
      case 'input-currency':
        stepDiv.appendChild(this.renderCurrencyInput(step));
        break;
      case 'radio-group':
        stepDiv.appendChild(this.renderRadioGroup(step));
        break;
      default:
        break;
    }

    return stepDiv;
  }

  renderSelect(step) {
    const options = this.options[step.stepId] || [];

    // Create wrapper based on step type
    const wrapperDiv = document.createElement('div');
    wrapperDiv.id = step.stepId === 'medication' ? 'medication-selector-wrapper' : 'insurance-types-wrapper';

    // Add prompt
    if (step.stepPrompt) {
      const promptP = document.createElement('p');
      promptP.innerHTML = step.stepPrompt;
      wrapperDiv.appendChild(promptP);
    }

    // Create inner wrapper for select
    const innerWrapper = document.createElement('div');
    innerWrapper.id = step.stepId === 'medication' ? 'brands-wrapper' : 'insurance-types-select-wrapper';

    const selectWrapper = document.createElement('div');
    selectWrapper.className = 'select-wrapper';

    const select = document.createElement('select');
    select.name = step.stepId;
    select.id = `${step.stepId}-selector`;

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = step.placeholder || 'Make your selection';
    select.appendChild(defaultOption);

    options.forEach((option) => {
      const optEl = document.createElement('option');
      optEl.value = option.optionValue;
      optEl.textContent = option.optionLabel;
      if (option.nextStepId) {
        optEl.setAttribute('data-next-screen', this.steps.findIndex((s) => s.stepId === option.nextStepId).toString());
      }
      if (option.resultId) {
        optEl.setAttribute('data-result-screen', option.resultId);
      }
      select.appendChild(optEl);
    });

    // Enable/disable next button based on selection
    select.addEventListener('change', () => {
      const nextButton = this.block.querySelector(`[data-step-id="${step.stepId}"] .btn-next`);
      if (select.value) {
        nextButton?.classList.remove('disabled');

        // Handle sub-options for commercial insurance
        if (step.stepId === 'insurance' && select.value === 'commercial') {
          this.showSubOptions(step.stepId);
        } else {
          this.hideSubOptions(step.stepId);
        }
      } else {
        nextButton?.classList.add('disabled');
      }
    });

    selectWrapper.appendChild(select);
    innerWrapper.appendChild(selectWrapper);
    wrapperDiv.appendChild(innerWrapper);

    // Add navigation buttons for medication step
    if (step.stepId === 'medication') {
      const buttonsDiv = document.createElement('div');
      buttonsDiv.className = 'buttons';
      buttonsDiv.innerHTML = `
        <a class="button disabled btn-prev" tabindex="0">Go back</a>
        <a class="button disabled btn-next" tabindex="0">Next</a>
      `;

      buttonsDiv.querySelector('.btn-prev')?.addEventListener('click', () => this.prevStep());
      buttonsDiv.querySelector('.btn-next')?.addEventListener('click', () => this.nextStep());

      wrapperDiv.appendChild(buttonsDiv);

      // Add additional brand information
      const brandInfo = document.createElement('div');
      brandInfo.className = 'paragraph paragraph--wrapper-text bottom-text additional-brand-information';
      brandInfo.innerHTML = `
        <div class="text-wrapper">
          <div class="text-long">
            <p>
              <span>See GLOBAL FULL PRESCRIBING INFORMATION for <a class="brand external-link-popup-disabled" href="https://www.otsuka-us.com/media/static/NUEDEXTA-PI.pdf" target="_blank">NUEDEXTA</a></span> and <a class="brand external-link-popup-disabled" href="https://otsuka-us.com/media/static/VOYXACT-PI.pdf" target="_blank">VOYXACT</a>.<br>
              <span>See U.S. FULL PRESCRIBING INFORMATION, including BOXED WARNING for <a class="brand" href="https://www.otsuka-us.com/media/static/Abilify-M-PI.pdf" target="_blank"><span class="nobr">ABILIFY MAINTENA</span></a>, <a class="brand external-link-popup-disabled" href="https://otsuka-us.com/media/static/Abilify-Asimtufii-PI.pdf" target="_blank"><span class="nobr">ABILIFY ASIMTUFII</span></a>, <a class="brand" href="https://www.otsuka-us.com/media/static/JYNARQUE-PI.pdf" target="_blank">JYNARQUE</a>, and <a class="brand" href="https://www.otsuka-us.com/media/static/Rexulti-PI.pdf" target="_blank">REXULTI</a></span>.<br>
              <span>See MEDICATION GUIDES for
                <a class="brand" href="https://www.otsuka-us.com/media/static/AbilifyM-MedGuide.pdf" target="_blank"><span class="nobr">ABILIFY MAINTENA</span></a>,
                <a class="brand external-link-popup-disabled" href="https://otsuka-us.com/media/static/Abilify-Asimtufii-MedGuide.pdf" target="_blank"><span class="nobr">ABILIFY ASIMTUFII</span></a>,
                <a class="brand" href="https://www.otsuka-us.com/media/static/JYNARQUE-Medguide.pdf" target="_blank">JYNARQUE</a>, and
                <a class="brand" href="https://www.otsuka-us.com/media/static/Rexulti-Medguide.pdf" target="_blank">REXULTI</a>.</span>
            </p>
          </div>
        </div>
      `;
      wrapperDiv.appendChild(brandInfo);
    }

    // Add sub-options container (for commercial insurance coverage)
    if (step.stepId === 'insurance') {
      const subOptionsDiv = document.createElement('div');
      subOptionsDiv.className = 'selection-screen selection-screen-internal wizard-hidden';
      subOptionsDiv.id = 'commercial-coverage-wrapper';

      const commercialOptions = this.options['insurance-commercial'] || [];
      if (commercialOptions.length > 0) {
        const subPrompt = document.createElement('p');
        subPrompt.textContent = 'Will insurance cover this medication?';
        subOptionsDiv.appendChild(subPrompt);

        const subSelectWrapper = document.createElement('div');
        subSelectWrapper.id = 'commercial-coverage-select-wrapper';

        const subSelectWrap = document.createElement('div');
        subSelectWrap.className = 'select-wrapper';

        const subSelect = document.createElement('select');
        subSelect.name = 'insurance_coverage';
        subSelect.id = 'insurance-coverage-selector';

        const subDefault = document.createElement('option');
        subDefault.value = '';
        subDefault.textContent = 'Make your selection';
        subSelect.appendChild(subDefault);

        commercialOptions.forEach((option) => {
          const optEl = document.createElement('option');
          optEl.value = option.optionValue;
          optEl.textContent = option.optionLabel;
          if (option.resultId) {
            optEl.setAttribute('data-result-screen', option.resultId);
          }
          if (option.nextStepId) {
            optEl.setAttribute('data-next-screen', this.steps.findIndex((s) => s.stepId === option.nextStepId).toString());
          }
          subSelect.appendChild(optEl);
        });

        subSelect.addEventListener('change', () => {
          this.data.insuranceCoverage = subSelect.value;
        });

        subSelectWrap.appendChild(subSelect);
        subSelectWrapper.appendChild(subSelectWrap);
        subOptionsDiv.appendChild(subSelectWrapper);
      }

      wrapperDiv.appendChild(subOptionsDiv);

      // Add buttons for insurance step
      const buttonsDiv = document.createElement('div');
      buttonsDiv.className = 'buttons';
      buttonsDiv.innerHTML = `
        <a class="button btn-prev" tabindex="0">Go back</a>
        <a class="button disabled btn-next" tabindex="0">Next</a>
      `;

      buttonsDiv.querySelector('.btn-prev')?.addEventListener('click', () => this.prevStep());
      buttonsDiv.querySelector('.btn-next')?.addEventListener('click', () => this.nextStep());

      wrapperDiv.appendChild(buttonsDiv);
    }

    return wrapperDiv;
  }

  showSubOptions() {
    const subOptions = this.block.querySelector('#commercial-coverage-wrapper');
    if (subOptions) {
      subOptions.classList.remove('wizard-hidden');
    }
  }

  hideSubOptions() {
    const subOptions = this.block.querySelector('#commercial-coverage-wrapper');
    if (subOptions) {
      subOptions.classList.add('wizard-hidden');
    }
  }

  renderNumberInput(step) {
    const fieldDiv = document.createElement('div');
    fieldDiv.id = 'field-size';

    const label = document.createElement('label');
    label.htmlFor = 'household_size';
    label.textContent = 'How many people live in the household?';

    const inputGroup = document.createElement('div');
    inputGroup.id = 'field-size-input-group';
    inputGroup.className = 'input-group';

    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'household_size';
    input.name = 'household_size';
    input.placeholder = step.placeholder || 'Write the number here';
    input.inputMode = 'numeric';
    input.autocomplete = 'off';
    input.min = step.minValue || 1;
    input.max = step.maxValue || 20;

    // Number masking
    input.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');

      // Enable/disable next button
      const nextButton = this.block.querySelector(`[data-step-id="${step.stepId}"] .btn-next`);
      const value = parseInt(e.target.value, 10);
      const min = step.minValue || 1;
      const max = step.maxValue || 20;

      if (value && value >= min && value <= max) {
        nextButton?.classList.remove('disabled');
        inputGroup.classList.remove('has-error');
      } else {
        nextButton?.classList.add('disabled');
      }
    });

    // Show error on blur if empty or invalid
    input.addEventListener('blur', (e) => {
      const value = parseInt(e.target.value, 10);
      const min = step.minValue || 1;
      const max = step.maxValue || 20;

      if (!e.target.value || !value || value < min || value > max) {
        inputGroup.classList.add('has-error');
      } else {
        inputGroup.classList.remove('has-error');
      }
    });

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = 'Please, enter the number in a range 1 - 20';

    inputGroup.appendChild(input);
    inputGroup.appendChild(errorDiv);
    fieldDiv.appendChild(label);
    fieldDiv.appendChild(inputGroup);

    // Add buttons
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'buttons';
    buttonsDiv.innerHTML = `
      <a class="button btn-prev" tabindex="0">Go back</a>
      <a class="button disabled btn-next" tabindex="0">Next</a>
    `;

    buttonsDiv.querySelector('.btn-prev')?.addEventListener('click', () => this.prevStep());
    buttonsDiv.querySelector('.btn-next')?.addEventListener('click', () => this.nextStep());

    const wrapper = document.createElement('div');
    wrapper.appendChild(fieldDiv);
    wrapper.appendChild(buttonsDiv);

    return wrapper;
  }

  renderCurrencyInput(step) {
    const fieldDiv = document.createElement('div');
    fieldDiv.id = 'field-income';

    const label = document.createElement('label');
    label.htmlFor = 'household_income';
    label.textContent = 'What is the estimated household income, before taxes?';

    const inputGroup = document.createElement('div');
    inputGroup.id = 'field-income-input-group';
    inputGroup.className = 'input-group';

    const inputWrapper = document.createElement('span');
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'household_income';
    input.name = 'household_income';
    input.placeholder = '$ 0.00';
    input.pattern = '[0-9,]';
    input.autocomplete = 'off';
    input.setAttribute('data-once', 'eligibilityWizard-mask-currency');
    input.inputMode = 'decimal';

    // Currency masking - matches Drupal inputmask behavior with $ prefix and comma separators
    const formatCurrency = (value) => {
      // Remove everything except digits and decimal
      let cleaned = value.replace(/[^0-9.]/g, '');

      // Handle multiple decimal points - keep only first
      const decimalIndex = cleaned.indexOf('.');
      if (decimalIndex !== -1) {
        cleaned = cleaned.substring(0, decimalIndex + 1)
          + cleaned.substring(decimalIndex + 1).replace(/\./g, '');
      }

      // Split into integer and decimal parts
      const parts = cleaned.split('.');
      let integerPart = parts[0] || '';
      let decimalPart = parts[1] || '';

      // Limit decimal to 2 places
      if (decimalPart.length > 2) {
        decimalPart = decimalPart.substring(0, 2);
      }

      // Add thousand separators to integer part
      if (integerPart) {
        integerPart = parseInt(integerPart, 10).toLocaleString('en-US');
      }

      // Reconstruct value
      if (parts.length > 1) {
        return `${integerPart}.${decimalPart}`;
      }
      return integerPart;
    };

    input.addEventListener('input', (e) => {
      const cursorPos = e.target.selectionStart;
      const oldValue = e.target.value;
      const oldLength = oldValue.length;

      // Get raw value without $ prefix
      const rawValue = oldValue.replace(/^\$\s*/, '');

      // Format the value
      const formatted = formatCurrency(rawValue);

      // Set new value with $ prefix
      if (formatted) {
        e.target.value = `$ ${formatted}`;
        inputGroup.classList.remove('has-error');
      } else {
        e.target.value = '';
      }

      // Adjust cursor position
      const newLength = e.target.value.length;
      const lengthDiff = newLength - oldLength;
      const newCursorPos = Math.max(3, cursorPos + lengthDiff); // Keep cursor after "$ "
      e.target.setSelectionRange(newCursorPos, newCursorPos);

      this.validateIncomeStep(step.stepId);
    });

    // Show error on blur if empty
    input.addEventListener('blur', (e) => {
      const rawValue = e.target.value.replace(/[^0-9.]/g, '');
      if (!rawValue || parseFloat(rawValue) === 0) {
        inputGroup.classList.add('has-error');
      } else {
        inputGroup.classList.remove('has-error');
      }
    });

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = "You can't submit without a number";

    inputWrapper.appendChild(input);
    inputGroup.appendChild(inputWrapper);
    inputGroup.appendChild(errorDiv);
    fieldDiv.appendChild(label);
    fieldDiv.appendChild(inputGroup);

    // Add frequency radio buttons
    const frequencyDiv = document.createElement('div');
    frequencyDiv.id = 'income-basis';

    const frequencies = [
      { value: 'annually', label: 'Per Year' },
      { value: 'monthly', label: 'Per Month' },
      { value: 'weekly', label: 'Per Week' },
    ];

    frequencies.forEach((freq) => {
      const radioWrapper = document.createElement('div');
      radioWrapper.className = 'radio-field-wrapper';

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.value = freq.value;
      radio.name = 'household_frequency';
      radio.id = `income-frequency-${freq.value}`;

      const radioLabel = document.createElement('label');
      radioLabel.htmlFor = radio.id;
      radioLabel.textContent = freq.label;
      radioLabel.tabIndex = 0;

      radio.addEventListener('change', () => {
        this.validateIncomeStep(step.stepId);
      });

      radioLabel.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          radio.click();
        }
      });

      radioWrapper.appendChild(radio);
      radioWrapper.appendChild(radioLabel);
      frequencyDiv.appendChild(radioWrapper);
    });

    // Add buttons
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'buttons';
    buttonsDiv.innerHTML = `
      <a class="button btn-prev" tabindex="0">Go back</a>
      <a class="button disabled btn-next" tabindex="0">Next</a>
    `;

    buttonsDiv.querySelector('.btn-prev')?.addEventListener('click', () => this.prevStep());
    buttonsDiv.querySelector('.btn-next')?.addEventListener('click', () => this.nextStep());

    const wrapper = document.createElement('div');
    wrapper.appendChild(fieldDiv);
    wrapper.appendChild(frequencyDiv);
    wrapper.appendChild(buttonsDiv);

    return wrapper;
  }

  validateIncomeStep(stepId) {
    const stepContainer = this.block.querySelector(`[data-step-id="${stepId}"]`);
    const input = stepContainer.querySelector('input[type="text"]');
    const frequency = stepContainer.querySelector('input[type="radio"]:checked');
    const nextButton = stepContainer.querySelector('.btn-next');

    if (input?.value && frequency) {
      nextButton?.classList.remove('disabled');
    } else {
      nextButton?.classList.add('disabled');
    }
  }

  renderRadioGroup(step) {
    const options = this.options[step.stepId] || [];
    const radioGroup = document.createElement('div');
    radioGroup.className = 'radio-group';

    options.forEach((option) => {
      const radioWrapper = document.createElement('div');
      radioWrapper.className = 'radio-field-wrapper';

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.value = option.optionValue;
      radio.name = step.stepId;
      radio.id = `${step.stepId}-${option.optionValue}`;

      const label = document.createElement('label');
      label.htmlFor = radio.id;
      label.textContent = option.optionLabel;
      label.tabIndex = 0;

      radio.addEventListener('change', () => {
        const nextButton = this.block.querySelector(`[data-step-id="${step.stepId}"] .btn-next`);
        nextButton?.classList.remove('disabled');
      });

      label.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          radio.click();
        }
      });

      radioWrapper.appendChild(radio);
      radioWrapper.appendChild(label);
      radioGroup.appendChild(radioWrapper);
    });

    return radioGroup;
  }

  // eslint-disable-next-line class-methods-use-this
  renderResults() {
    const resultsSection = document.createElement('section');
    resultsSection.id = 'eligibility-wizard-results';
    resultsSection.className = 'selection-screen wizard-hidden';
    resultsSection.setAttribute('data-screen', '4');

    const personalizedResults = document.createElement('div');
    personalizedResults.id = 'personalized-results';
    personalizedResults.className = 'paragraph paragraph-icon-callout icon-none cta-accent-r';

    const ctaCopyWrapper = document.createElement('div');
    ctaCopyWrapper.className = 'cta-copy-wrapper';

    const ctaCopy = document.createElement('div');
    ctaCopy.className = 'cta-copy';

    // Create all result permutations
    const resultPermutations = {
      'no-prescription': {
        dataResult: '1',
        title: 'You may not be eligible for assistance',
        intro: '',
        steps: `
          <div class="row">
            <div class="result-step-content">
              <p>We encourage you to call our Dedicated Patient Access Advocates to discuss your eligibility. They can be reached at <a href="tel:1-855-727-6274"><span class="nobr">1-855-727-6274</span></a>, <strong>Monday-Friday, </strong><span class="nobr"><strong>8am - 6pm&nbsp;ET</strong></span>.</p>
            </div>
          </div>
        `,
      },
      'med-not-listed': {
        dataResult: '2',
        title: 'You may not be eligible for assistance',
        intro: '',
        steps: `
          <div class="row">
            <div class="result-step-content">
              <p>We encourage you to call our Dedicated Patient Access Advocates to discuss your eligibility. They can be reached at <a href="tel:1-855-727-6274"><span class="nobr">1-855-727-6274</span></a>, <strong>Monday-Friday, </strong><span class="nobr"><strong>8am - 6pm&nbsp;ET</strong></span>.</p>
            </div>
          </div>
        `,
      },
      'already-covered': {
        dataResult: '3',
        title: 'You may not be eligible for assistance',
        intro: '',
        steps: `
          <div class="row">
            <div class="result-step-content">
              <p>We encourage you to call our Dedicated Patient Access Advocates to discuss your eligibility. They can be reached at <a href="tel:1-855-727-6274"><span class="nobr">1-855-727-6274</span></a>, <strong>Monday-Friday, </strong><span class="nobr"><strong>8am - 6pm&nbsp;ET</strong></span>.</p>
            </div>
          </div>
        `,
      },
      'income-fails': {
        dataResult: '4',
        title: 'You may not be eligible for assistance',
        intro: '',
        steps: `
          <div class="row">
            <div class="result-step-content">
              <p>We encourage you to call our Dedicated Patient Access Advocates to discuss your eligibility. They can be reached at <a href="tel:1-855-727-6274"><span class="nobr">1-855-727-6274</span></a>, <strong>Monday-Friday, </strong><span class="nobr"><strong>8am - 6pm&nbsp;ET</strong></span>.</p>
            </div>
          </div>
        `,
      },
      'income-passes': {
        dataResult: '5',
        title: 'You may be eligible for assistance',
        intro: '<h3>Here are the next steps:</h3>',
        steps: `
          <div class="row">
            <div class="result-step-content">
              <p>If you are a patient that has been prescribed an Otsuka medication you may start an application online via the <a href="https://opaf.my.site.com/Patient/s/">OPAF Care Connect Patient Portal</a>.</p>
              <p>If you are a HealthCare professional (HCP) that has a patient prescribed an Otsuka medication you may start an application online via the <a href="https://opaf.my.site.com/Prescriber/s/">OPAF Care Connect Prescriber Portal</a>.</p>
              <p>If you'd prefer to use a paper application, you can&nbsp;<a href="/apply-for-yourself">download the application</a>.&nbsp;</p>
              <p>To help expedite the application process, please be sure to provide your HCP <a class="proper-documentation" href="#">the required documentation</a>.</p>
            </div>
          </div>
          <div class="row">
            <div class="result-step-content">
              <p>If you have any questions, please call our Dedicated Patient Access Advocates. They can be reached at <a href="tel:1-855-727-6274"><span class="nobr">1-855-727-6274</span></a>, <strong>Monday-Friday, </strong><span class="nobr"><strong>8am - 6pm&nbsp;ET</strong></span>.</p>
            </div>
          </div>
        `,
      },
      'income-passes-unsure': {
        dataResult: '6',
        title: 'You may be eligible for assistance',
        intro: '<h3>Here are the next steps:</h3>',
        steps: `
          <div class="row">
            <div class="result-step-content">
              <p>If you are a patient that has been prescribed an Otsuka medication you may start an application online via the <a href="https://opaf.my.site.com/Patient/s/">OPAF Care Connect Patient Portal</a>.</p>
              <p>If you are a HealthCare professional (HCP) that has a patient prescribed an Otsuka medication you may start an application online via the <a href="https://opaf.my.site.com/Prescriber/s/">OPAF Care Connect Prescriber Portal</a>.</p>
              <p>If you'd prefer to use a paper application, you can&nbsp;<a href="/apply-for-yourself">download the application</a>.&nbsp;</p>
              <p>To help expedite the application process, please be sure to provide your HCP <a class="proper-documentation" href="#">the required documentation</a>.</p>
            </div>
          </div>
          <div class="row">
            <div class="result-step-content">
              <p>You may download an application at<a href="/patient-forms"> OPAF | Patient Forms</a> and together with your healthcare professional (HCP) fill and submit an application for assistance.</p>
              <p>To help expedite the application process, please be sure to provide your HCP <a class="proper-documentation" href="#">the required documentation</a>.</p>
            </div>
          </div>
          <div class="row">
            <div class="result-step-content">
              <p>If you have any questions, please call our Dedicated Patient Access Advocates. They can be reached at <a href="tel:1-855-727-6274"><span class="nobr">1-855-727-6274</span></a>, <strong>Monday-Friday, </strong><span class="nobr"><strong>8am - 6pm&nbsp;ET</strong></span>.</p>
            </div>
          </div>
        `,
      },
      jynarque: {
        dataResult: '7',
        title: 'You may be eligible for assistance',
        intro: '<h3>JYNARQUE Risk Evaluation and Mitigation Strategy (REMS):</h3>',
        steps: `
          <div class="row">
            <div class="result-step-content">
              <p>JYNARQUE has special monitoring requirements. Your healthcare provider must be enrolled in the REMS program.</p>
              <p>Call <a href="tel:1-855-727-6274"><span class="nobr">1-855-727-6274</span></a> for more information about JYNARQUE eligibility.</p>
            </div>
          </div>
        `,
      },
      'income-passes-nd-aa': {
        dataResult: '8',
        title: 'You may be eligible for assistance',
        intro: '<h3>Here are the next steps:</h3>',
        steps: `
          <div class="row">
            <div class="result-step-content">
              <p>You may download an application at<a href="/patient-forms"> OPAF | Patient Forms</a> and together with your healthcare professional (HCP) fill and submit an application for assistance.</p>
              <p>To help expedite the application process, please be sure to provide your HCP <a class="proper-documentation" href="#">the required documentation</a>.</p>
            </div>
          </div>
          <div class="row">
            <div class="result-step-content">
              <p>If you have any questions, please call our Dedicated Patient Access Advocates. They can be reached at <a href="tel:1-855-727-6274"><span class="nobr">1-855-727-6274</span></a>, <strong>Monday-Friday, </strong><span class="nobr"><strong>8am - 6pm&nbsp;ET</strong></span>.</p>
            </div>
          </div>
        `,
      },
    };

    // Render each result permutation
    Object.entries(resultPermutations).forEach(([key, result]) => {
      const resultDiv = document.createElement('div');
      resultDiv.id = `results-${key}`;
      resultDiv.className = 'result-permutation wizard-hidden';
      resultDiv.setAttribute('data-result', result.dataResult);

      resultDiv.innerHTML = `
        <h2><span class="txt-section">${result.title}</span></h2>
        <div class="result-intro">${result.intro}</div>
        <div class="next-steps">${result.steps}</div>
      `;

      ctaCopy.appendChild(resultDiv);
    });

    ctaCopyWrapper.appendChild(ctaCopy);
    personalizedResults.appendChild(ctaCopyWrapper);
    resultsSection.appendChild(personalizedResults);

    // Add action buttons
    const actionsWrapper = document.createElement('div');
    actionsWrapper.className = 'result-actions-wrapper';
    actionsWrapper.id = 'result-actions-wrapper';
    actionsWrapper.innerHTML = `
      <a class="button btn-restart trigger-wizard-restart" href="#start-check" tabindex="0">Start over</a>
    `;

    // Add event listeners
    actionsWrapper.querySelector('.btn-restart')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.restart();
    });

    resultsSection.appendChild(actionsWrapper);

    // Add footnote
    const footnote = document.createElement('div');
    footnote.className = 'result-intro-footnote';
    footnote.innerHTML = '<p>If you have any questions about OPAF, eligibility, or the documentation that\'s required, please visit our <a href="/faqs">FAQ section</a>.</p>';
    resultsSection.appendChild(footnote);

    return resultsSection;
  }

  render() {
    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.id = 'eligibility-wizard-wrapper';

    // Create main eligibility wizard container
    const wizardDiv = document.createElement('div');
    wizardDiv.id = 'eligibility-wizard';

    // Add main heading
    if (this.config.mainHeading) {
      const heading = document.createElement('h2');
      heading.textContent = this.config.mainHeading;
      wizardDiv.appendChild(heading);
    }

    // Create content wrapper for progress and form
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'wizard-content-wrapper';

    // Add progress indicator
    contentWrapper.appendChild(this.renderProgressIndicator());

    // Create wizard fixed wrapper (contains geo-block message and form)
    const fixedWrapper = document.createElement('div');
    fixedWrapper.className = 'wizard-fixed-wrapper';

    // Add geo-block message if user is outside allowed region
    const geoBlockMessage = document.createElement('div');
    geoBlockMessage.className = 'geo-block-message';
    if (!this.isOutsideRegion) {
      geoBlockMessage.classList.add('wizard-hidden');
    }
    geoBlockMessage.innerHTML = GEO_CONFIG.outsideRegionMessage;
    fixedWrapper.appendChild(geoBlockMessage);

    // Create wizard form
    const form = document.createElement('form');
    form.className = 'wizard-form';
    // Hide form if user is outside region
    if (this.isOutsideRegion) {
      form.classList.add('wizard-hidden');
    }

    // Render all steps
    this.steps.forEach((step) => {
      if (step.stepId !== 'results') {
        form.appendChild(this.renderStep(step));
      }
    });

    fixedWrapper.appendChild(form);

    // Add results section (outside form)
    fixedWrapper.appendChild(this.renderResults());

    contentWrapper.appendChild(fixedWrapper);
    wizardDiv.appendChild(contentWrapper);
    wrapper.appendChild(wizardDiv);
    this.block.appendChild(wrapper);

    // Add geo bypass click handler
    const bypassLink = this.block.querySelector('#geolocate-bypass');
    if (bypassLink) {
      bypassLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.bypassGeoBlock();
      });
    }

    // Initialize UI
    this.updateUI();
  }
}

/**
 * Add interactive functionality to match Drupal behavior
 */
function addInteractiveFunctionality(block, wizard) {
  // Radio button label click handler
  const setupRadioLabels = () => {
    const radioWrappers = block.querySelectorAll('.radio-field-wrapper');

    radioWrappers.forEach((wrapper) => {
      const label = wrapper.querySelector('label');
      const radio = wrapper.querySelector('input[type="radio"]');

      if (label && radio) {
        label.addEventListener('click', () => {
          radio.click();
        });
      }
    });
  };

  // Keyboard navigation (Enter key triggers click)
  const setupKeyboardNav = () => {
    const interactiveElements = block.querySelectorAll('.radio-field-wrapper label, .button');

    interactiveElements.forEach((element) => {
      element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          element.click();
        }
      });
    });
  };

  // Input masking for household size (integer only)
  const setupHouseholdSizeMask = () => {
    const input = block.querySelector('#household_size');
    if (input) {
      input.addEventListener('input', (e) => {
        // Only allow numbers
        e.target.value = e.target.value.replace(/[^0-9]/g, '');

        // Update next button state
        const nextButton = input.closest('.selection-screen').querySelector('.btn-next');
        const val = parseInt(e.target.value, 10);
        if (e.target.value && val >= 1 && val <= 20) {
          nextButton?.classList.remove('disabled');
        } else {
          nextButton?.classList.add('disabled');
        }
      });

      input.addEventListener('blur', (e) => {
        const value = parseInt(e.target.value, 10);
        if (value && value >= 1 && value <= 20) {
          e.target.value = value.toString();
        }
      });
    }
  };

  // Input masking for household income is already handled in renderCurrencyInput()
  // This just sets the placeholder
  const setupHouseholdIncomeMask = () => {
    const input = block.querySelector('#household_income');
    if (input) {
      input.setAttribute('placeholder', '$ 0.00');
    }
  };

  // Check if income step is complete (both income and frequency selected)
  const checkIncomeStepComplete = () => {
    const input = block.querySelector('#household_income');
    const frequency = block.querySelector('input[name="household_frequency"]:checked');
    const nextButton = block.querySelector('#selection-income .btn-next');

    if (input && input.value && input.value !== '$ ' && frequency) {
      nextButton?.classList.remove('disabled');
    } else {
      nextButton?.classList.add('disabled');
    }
  };

  // Radio button change handler for income frequency
  const setupIncomeFrequencyHandler = () => {
    const radios = block.querySelectorAll('input[name="household_frequency"]');
    radios.forEach((radio) => {
      radio.addEventListener('change', checkIncomeStepComplete);
    });
  };

  // Initialize all interactive features
  const initInteractivity = () => {
    setupRadioLabels();
    setupKeyboardNav();
    setupHouseholdSizeMask();
    setupHouseholdIncomeMask();
    setupIncomeFrequencyHandler();
  };

  // Run initialization after a short delay to ensure DOM is ready
  setTimeout(initInteractivity, 100);

  // Also re-run when wizard updates (step changes)
  const originalUpdateUI = wizard.updateUI.bind(wizard);
  wizard.updateUI = function updateUIWithInteractivity() {
    originalUpdateUI();
    setTimeout(initInteractivity, 50);
  };
}

export default function decorate(block) {
  // Extract authored content before clearing the block
  // In EDS, authored fields appear as rows - first row is mainHeading
  const rows = [...block.children];
  let authoredMainHeading = '';

  // Get mainHeading from the first row (single cell with value)
  if (rows.length > 0) {
    const firstRow = rows[0];
    // Could be single cell with just the value, or two cells (label + value)
    const cells = [...firstRow.children];
    if (cells.length === 1) {
      // Single cell - just the value
      authoredMainHeading = cells[0]?.textContent?.trim() || '';
    } else if (cells.length >= 2) {
      // Two cells - second cell is the value
      authoredMainHeading = cells[1]?.textContent?.trim() || '';
    }
  }

  // Clear block content for runtime rendering
  block.innerHTML = '';

  // Built-in configuration (use authored values if available)
  const builtInConfig = {
    mainHeading: authoredMainHeading || 'Please answer all of the following questions:',
    fplThresholdPercent: 500,
  };

  const builtInSteps = [
    {
      stepId: 'medication',
      stepTitle: 'Medication',
      stepLabel: 'Medication',
      stepPrompt: 'Select the medication:',
      stepType: 'select',
      placeholder: 'Make your selection',
    },
    {
      stepId: 'insurance',
      stepTitle: 'Insurance',
      stepLabel: 'Insurance',
      stepPrompt: 'Select the type of insurance coverage',
      stepType: 'select',
      placeholder: 'Make your selection',
    },
    {
      stepId: 'household',
      stepTitle: 'Household',
      stepLabel: 'Household',
      stepType: 'input-number',
      placeholder: 'Write the number here',
      minValue: 1,
      maxValue: 20,
    },
    {
      stepId: 'income',
      stepTitle: 'Income',
      stepLabel: 'Income',
      stepType: 'input-currency',
      placeholder: '$ 0.00',
    },
  ];

  const builtInOptions = {
    medication: [
      { optionValue: 'abilifymaintena', optionLabel: 'ABILIFY MAINTENA®' },
      { optionValue: 'abilifyasimtufii', optionLabel: 'ABILIFY ASIMTUFII™', specialTag: 'abilifyasimtufii' },
      { optionValue: 'nuedexta', optionLabel: 'NUEDEXTA®', specialTag: 'nuedexta' },
      { optionValue: 'jynarque', optionLabel: 'JYNARQUE®', specialTag: 'jynarque' },
      { optionValue: 'rexulti', optionLabel: 'REXULTI®' },
      { optionValue: 'voyxact', optionLabel: 'VOYXACT™' },
      { optionValue: 'no_prescription', optionLabel: "A prescription hasn't been written yet", resultId: 'no-prescription' },
      { optionValue: 'med_not_listed', optionLabel: 'The medication is not listed', resultId: 'med-not-listed' },
    ],
    insurance: [
      { optionValue: 'commercial', optionLabel: 'Commercial Insurance (Employer or Healthcare Marketplace)', hasSubOptions: true },
      { optionValue: 'government', optionLabel: 'Government Insurance (Medicare, Medicaid, VA Benefits, or TRICARE)' },
      { optionValue: 'no_insurance', optionLabel: 'No Insurance' },
    ],
    'insurance-commercial': [
      { optionValue: 'yes', optionLabel: 'Yes, coverage has been approved', resultId: 'already-covered' },
      { optionValue: 'no', optionLabel: 'No, coverage has been denied' },
      { optionValue: 'unsure', optionLabel: "I'm unsure of the coverage" },
    ],
  };

  // Results mapping - used for validation only, actual content is in renderResults()
  const builtInResults = {
    'no-prescription': { resultId: 'no-prescription' },
    'med-not-listed': { resultId: 'med-not-listed' },
    'already-covered': { resultId: 'already-covered' },
    'income-fails': { resultId: 'income-fails' },
    'income-passes': { resultId: 'income-passes' },
    'income-passes-unsure': { resultId: 'income-passes-unsure' },
    'jynarque-eligible': { resultId: 'jynarque-eligible' },
    'income-passes-nd-aa': { resultId: 'income-passes-nd-aa' },
  };

  // Create wizard instance with built-in data
  const wizard = new EligibilityWizard(block, builtInConfig);
  wizard.steps = builtInSteps;
  wizard.options = builtInOptions;
  wizard.results = builtInResults;

  // Initialize wizard
  wizard.init();

  // Add interactive functionality after render
  addInteractiveFunctionality(block, wizard);
}
