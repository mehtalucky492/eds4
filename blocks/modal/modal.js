import { loadFragment } from "../fragment/fragment.js";
import {
  buildBlock,
  decorateBlock,
  decorateIcons,
  loadBlock,
  loadCSS,
} from "../../scripts/aem.js";
 
async function loadSimpleBar() {
  if (window.SimpleBar) return;
 
  await loadCSS("https://unpkg.com/simplebar@latest/dist/simplebar.min.css");
 
  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/simplebar@latest/dist/simplebar.min.js";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
 
export async function createModal(contentNodes) {
  await loadCSS(`${window.hlx.codeBasePath}/blocks/modal/modal.css`);
 
  const dialog = document.createElement("dialog");
 
  const dialogContent = document.createElement("div");
  dialogContent.classList.add("modal-content");
  dialogContent.append(...contentNodes);
  dialog.append(dialogContent);
 
  // Default close button (for all modals)
  const closeButton = document.createElement("button");
  closeButton.classList.add("close-button");
  closeButton.setAttribute("aria-label", "Close");
  closeButton.type = "button";
  closeButton.innerHTML = '<span class="icon icon-close"></span>';
  closeButton.addEventListener("click", () => dialog.close());
  dialog.append(closeButton);
 
  // Close dialog on outside click
  dialog.addEventListener("click", (event) => {
    const dialogDimensions = dialog.getBoundingClientRect();
    if (
      event.clientX < dialogDimensions.left ||
      event.clientX > dialogDimensions.right ||
      event.clientY < dialogDimensions.top ||
      event.clientY > dialogDimensions.bottom
    ) {
      dialog.close();
    }
  });
 
  const block = buildBlock("modal", "");
  document.querySelector("main").append(block);
  decorateBlock(block);
  await loadBlock(block);
 
  decorateIcons(closeButton);
 
  dialog.addEventListener("close", () => block.remove());
 
  block.append(dialog);
 
  return {
    block,
    showModal: async () => {
      dialog.showModal();
 
      // Wrap 2 Otsuka buttons inside one parent div (inside modal only)
      const wrappers = dialog.querySelectorAll(".otsuka-button-wrapper");
 
      if (wrappers.length === 2) {
        const parent = document.createElement("div");
        parent.className = "parent-otsuka-button-wrapper";
 
        wrappers[0].parentNode.insertBefore(parent, wrappers[0]);
        wrappers.forEach((wrapper) => parent.appendChild(wrapper));
      }
 
      // Close modal using #close-modal link
      dialog.addEventListener("click", (e) => {
        const closeLink = e.target.closest('a[href*="#close-modal"]');
        if (!closeLink) return;
 
        e.preventDefault();
        dialog.close();
      });
 
      const secureHeading = dialog.querySelector(
        ".modal-secure-messaging-heading",
      );
      const secureBody = dialog.querySelector(".modal-secure-messaging-body");
      const patientPortalSection = dialog.querySelector(".modal-patient-portal");
 
      // ---------------------------------------------------
      // Secure Messaging: Use heading image as close button
      // ---------------------------------------------------
      if (secureHeading) {
        closeButton.style.display = "none";
 
        const closeImg =
          secureHeading.querySelector("picture") ||
          secureHeading.querySelector("img");
 
        if (closeImg) {
          closeImg.style.cursor = "pointer";
 
          closeImg.addEventListener("click", (e) => {
            e.preventDefault();
            dialog.close();
          });
        }
      }
 
      // ---------------------------------------------------
      // Patient Portal: Use image as close button
      // ---------------------------------------------------
      if (patientPortalSection) {
        closeButton.style.display = "none";
 
        const closeImg =
          patientPortalSection.querySelector("picture") ||
          patientPortalSection.querySelector("img");
 
        if (closeImg) {
          closeImg.style.cursor = "pointer";
 
          closeImg.addEventListener("click", (e) => {
            e.preventDefault();
            dialog.close();
          });
        }
      }
 
      // ---------------------------------------------------
      // Secure Messaging: SimpleBar scroll
      // ---------------------------------------------------
      if (secureHeading && secureBody) {
        await loadSimpleBar();
 
        secureBody.style.overflow = "auto";
        secureBody.setAttribute("data-simplebar", "");
      }
 
      // ---------------------------------------------------
      // Scroll reset (works with SimpleBar)
      // ---------------------------------------------------
      setTimeout(() => {
        if (secureHeading && secureBody) {
          const sbWrapper = secureBody.querySelector(
            ".simplebar-content-wrapper",
          );
          if (sbWrapper) sbWrapper.scrollTop = 0;
        } else {
          dialogContent.scrollTop = 0;
        }
      }, 0);
    },
  };
}
 
export async function openModal(fragmentUrl) {
  const path = fragmentUrl.startsWith("http")
    ? new URL(fragmentUrl, window.location).pathname
    : fragmentUrl;
 
  const fragment = await loadFragment(path);
  const { showModal } = await createModal(fragment.childNodes);
  showModal();
}
