(() => {
  const storageKey = "pizzaBellaCalepin";
  const cards = Array.from(document.querySelectorAll("[data-menu-item]"));
  const sections = Array.from(document.querySelectorAll("[data-menu-section]"));
  const search = document.querySelector("#menuSearch");
  const resultCount = document.querySelector("#resultCount");
  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const pad = document.querySelector("#orderPad");
  const padList = document.querySelector("#padList");
  const padEmpty = document.querySelector("#padEmpty");
  const padTotal = document.querySelector("#padTotal");
  const padCount = document.querySelector("#notepadCount");
  const padToggle = document.querySelector("#notepadToggle");
  const closePad = document.querySelector("#closePad");
  const clearPad = document.querySelector("#clearPad");

  if (!cards.length || !search || !pad) {
    return;
  }

  const normalize = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[’']/g, " ")
      .toLowerCase()
      .trim();

  const formatPrice = (value) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR"
    }).format(value);

  const items = cards.map((card) => {
    const checkbox = card.querySelector("[data-note-toggle]");
    const name = card.dataset.name || card.querySelector("h3")?.textContent || "";
    const price = Number(card.dataset.price || 0);
    const keywords = [
      card.dataset.keywords,
      card.textContent,
      card.closest("[data-menu-section]")?.querySelector("h2")?.textContent
    ].join(" ");

    return {
      card,
      checkbox,
      id: card.dataset.id,
      name,
      price,
      haystack: normalize(keywords)
    };
  });

  const itemById = new Map(items.map((item) => [item.id, item]));
  const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
  const selected = new Set(stored.filter((id) => itemById.has(id)));
  let activeFilter = "";

  const save = () => {
    localStorage.setItem(storageKey, JSON.stringify(Array.from(selected)));
  };

  const setPadOpen = (open) => {
    pad.classList.toggle("is-open", open);
    pad.setAttribute("aria-hidden", String(!open));
    padToggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("pad-open", open);
  };

  const setSelected = (id, isSelected) => {
    const item = itemById.get(id);
    if (!item) {
      return;
    }

    if (isSelected) {
      selected.add(id);
    } else {
      selected.delete(id);
    }

    item.checkbox.checked = isSelected;
    item.card.classList.toggle("is-selected", isSelected);
    save();
    renderPad();
  };

  function renderPad() {
    const selectedItems = items.filter((item) => selected.has(item.id));
    padList.innerHTML = selectedItems
      .map(
        (item) => `
          <li>
            <div>
              <strong>${item.name}</strong>
              <span>${formatPrice(item.price)}</span>
            </div>
            <button type="button" data-pad-remove="${item.id}" aria-label="Retirer ${item.name}">×</button>
          </li>
        `
      )
      .join("");

    padEmpty.hidden = selectedItems.length > 0;
    padTotal.textContent = formatPrice(selectedItems.reduce((sum, item) => sum + item.price, 0));
    padCount.textContent = String(selectedItems.length);
    padToggle.setAttribute("aria-label", `Calepin, ${selectedItems.length} sélection`);

    padList.querySelectorAll("[data-pad-remove]").forEach((button) => {
      button.addEventListener("click", () => {
        setSelected(button.dataset.padRemove, false);
      });
    });
  }

  const applyFilters = () => {
    const queryTerms = normalize(search.value).split(/\s+/).filter(Boolean);
    const filterTerms = normalize(activeFilter).split(/\s+/).filter(Boolean);
    let visibleCount = 0;

    items.forEach((item) => {
      const matchesSearch = queryTerms.every((term) => item.haystack.includes(term));
      const matchesFilter = filterTerms.length === 0 || filterTerms.some((term) => item.haystack.includes(term));
      const visible = matchesSearch && matchesFilter;
      item.card.hidden = !visible;
      if (visible) {
        visibleCount += 1;
      }
    });

    sections.forEach((section) => {
      const hasVisibleCard = Array.from(section.querySelectorAll("[data-menu-item]")).some((card) => !card.hidden);
      section.hidden = !hasVisibleCard;
    });

    resultCount.textContent = `${visibleCount} produit${visibleCount > 1 ? "s" : ""} affiché${visibleCount > 1 ? "s" : ""}`;
  };

  items.forEach((item) => {
    const isSelected = selected.has(item.id);
    item.checkbox.checked = isSelected;
    item.card.classList.toggle("is-selected", isSelected);
    item.checkbox.addEventListener("change", () => {
      setSelected(item.id, item.checkbox.checked);
    });
  });

  filterButtons.forEach((button) => {
    button.setAttribute("aria-pressed", button.classList.contains("is-active") ? "true" : "false");
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter || "";
      filterButtons.forEach((item) => {
        const isActive = item === button;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-pressed", String(isActive));
      });
      applyFilters();
    });
  });

  search.addEventListener("input", applyFilters);
  padToggle.addEventListener("click", () => {
    setPadOpen(!pad.classList.contains("is-open"));
  });
  closePad.addEventListener("click", () => setPadOpen(false));
  clearPad.addEventListener("click", () => {
    Array.from(selected).forEach((id) => setSelected(id, false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setPadOpen(false);
    }
  });

  renderPad();
  applyFilters();
})();
