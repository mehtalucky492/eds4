export default async function decorate(block) {
  const rows = [...block.children];

  rows.forEach((row) => {
    const cell = row.children[0];
    const textContent = cell.textContent.trim().toLowerCase();

    // Apply height class based on configuration value
    if (['xs', 'sm', 'md', 'lg', 'xl'].includes(textContent)) {
      block.classList.add(textContent);
      row.remove();
    }
  });
}
