(() => {
  const storageKey = "pizzaBellaCalepin_v2";
  const menuList = document.querySelector("#menuList");
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

  // Modal elements
  const modal = document.querySelector("#customizeModal");
  const modalTitle = document.querySelector("#modalPizzaName");
  const closeModal = document.querySelector("#closeModal");
  const cancelModal = document.querySelector("#cancelModal");
  const saveModal = document.querySelector("#saveModal");
  const removeList = document.querySelector("#removeList");
  const addList = document.querySelector("#addList");
  const ingSearch = document.querySelector("#ingSearch");

  const ingredientsData = [
    { name: "Jambon", price: 1.5 },
    { name: "Champignons", price: 1.5 },
    { name: "Oeuf", price: 1.5 },
    { name: "Lardons", price: 1.5 },
    { name: "Persillade", price: 1.5 },
    { name: "Fromage", price: 1.5 },
    { name: "Tomates", price: 1.5 },
    { name: "Poivrons", price: 1.5 },
    { name: "Artichaut", price: 1.5 },
    { name: "Olives", price: 1.5 },
    { name: "Oignons", price: 1.5 },
    { name: "Chèvre", price: 1.5 },
    { name: "Gorgonzola", price: 1.5 },
    { name: "Cantal", price: 1.5 },
    { name: "Pomme de terre", price: 1.5 },
    { name: "Bolognaise", price: 1.5 },
    { name: "Jambon de pays", price: 1.5 },
    { name: "Merguez", price: 1.5 },
    { name: "Chorizo", price: 1.5 },
    { name: "Anchois", price: 1.5 },
    { name: "Aubergines", price: 1.5 },
    { name: "Poulet au curry", price: 1.5 },
    { name: "Viande hachée", price: 1.5 },
    { name: "Cheddar", price: 1.5 },
    { name: "Sauce burger", price: 1.5 },
    { name: "Reblochon", price: 1.5 },
    { name: "Miel", price: 1.5 },
    { name: "Amandes effilées", price: 1.5 },
    { name: "Sauce blanche", price: 1.5 },
    { name: "Viande kebab", price: 1.5 },
    { name: "Boulettes d'agneau", price: 1.5 },
    { name: "Saint-Jacques", price: 2.5 },
    { name: "Saumon", price: 2.5 },
    { name: "Andouille de Guémené", price: 2.5 }
  ];

  let cart = JSON.parse(localStorage.getItem(storageKey) || "{}");
  let currentCustomizing = null; // { baseId, removed: [], added: [], originalIngredients: [] }
  let activeFilter = "";

  const normalize = (v) => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’']/g, " ").toLowerCase().trim();
  const formatPrice = (v) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v);

  const getBaseItem = (id) => {
    const card = document.querySelector(`.pizza-card[data-id="${id}"]`);
    if (!card) return null;
    return {
      id,
      name: card.dataset.name,
      price: parseFloat(card.dataset.price),
      ingredients: (card.dataset.ingredients || "").split(", ").filter(Boolean)
    };
  };

  const save = () => {
    localStorage.setItem(storageKey, JSON.stringify(cart));
    renderAll();
  };

  const updateQty = (key, delta) => {
    if (!cart[key]) {
      const base = getBaseItem(key);
      if (!base) return;
      cart[key] = { ...base, qty: 0, removed: [], added: [] };
    }
    cart[key].qty = Math.max(0, cart[key].qty + delta);
    if (cart[key].qty === 0 && (cart[key].removed.length > 0 || cart[key].added.length > 0)) {
      delete cart[key];
    } else if (cart[key].qty === 0) {
      delete cart[key];
    }
    save();
  };

  const generateCustomName = (baseName, removed, added) => {
    if (removed.length === 0 && added.length === 0) return baseName;
    if (removed.length === 0 && added.length <= 2) return `${baseName} avec ${added.join(" et ").toLowerCase()}`;
    if (added.length === 0 && removed.length <= 2) return `${baseName} sans ${removed.join(" et sans ").toLowerCase()}`;
    return `${baseName} Personnalisée`;
  };

  const getCartKey = (baseId, removed, added) => {
    if (removed.length === 0 && added.length === 0) return baseId;
    const r = [...removed].sort().join("|");
    const a = [...added].sort().join("|");
    return `${baseId}:-:${r}:+:${a}`;
  };

  const renderAll = () => {
    // Update base cards
    document.querySelectorAll(".pizza-card[data-menu-item]").forEach(card => {
      const id = card.dataset.id;
      const qty = cart[id]?.qty || 0;
      renderQtyControls(card.querySelector("[data-qty-for]"), id, qty);
    });

    // Handle custom cards in menu
    document.querySelectorAll(".custom-pizza-card").forEach(c => c.remove());
    Object.entries(cart).forEach(([key, item]) => {
      if (item.removed.length > 0 || item.added.length > 0) {
        renderCustomCard(item, key);
      }
    });

    renderPad();
    applyFilters();
  };

  const renderQtyControls = (container, key, qty) => {
    if (!container) return;
    if (qty === 0) {
      container.innerHTML = `<button class="qty-btn plus" type="button" data-key="${key}" data-action="plus">+</button>`;
    } else {
      let icons = "";
      if (qty <= 3) {
        icons = `<span class="pizza-icons">${"🍕".repeat(qty)}</span>`;
      } else {
        icons = `<span class="pizza-icons">${qty} 🍕</span>`;
      }
      container.innerHTML = `
        <div class="qty-display">${icons}</div>
        <button class="qty-btn" type="button" data-key="${key}" data-action="minus">-</button>
        <button class="qty-btn plus" type="button" data-key="${key}" data-action="plus">+</button>
      `;
    }
  };

  const renderCustomCard = (item, key) => {
    const baseCard = document.querySelector(`.pizza-card[data-id="${item.id}"]`);
    if (!baseCard) return;
    
    const div = document.createElement("article");
    div.className = "pizza-card custom-pizza-card is-selected";
    div.dataset.keywords = baseCard.dataset.keywords;
    div.innerHTML = `
      <div class="card-head"><h3>${item.name}</h3><strong>${formatPrice(item.price)}</strong></div>
      <div class="card-footer">
        <div class="ingredients-line">
          <span>${item.ingredients.join(", ")}.</span>
          <button class="customize-btn" type="button" data-edit-custom="${key}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
          </button>
        </div>
        <div class="quantity-controls" data-qty-for-custom="${key}"></div>
      </div>
    `;
    baseCard.after(div);
    renderQtyControls(div.querySelector("[data-qty-for-custom]"), key, item.qty);
  };

  const renderPad = () => {
    const items = Object.entries(cart).filter(([_, item]) => item.qty > 0);
    padList.innerHTML = items.map(([key, item]) => {
      const qtyText = item.qty === 1 ? "Une" : item.qty === 2 ? "Deux" : item.qty === 3 ? "Trois" : item.qty;
      const nameText = `${qtyText} ${item.name.toLowerCase()}${item.qty > 1 && !item.name.endsWith("s") && !item.name.includes(" ") ? "s" : ""}`;
      
      let script = "";
      if (item.removed.length > 0 || item.added.length > 0) {
        const adds = item.added.length > 0 ? ` avec supplément ${item.added.join(", ")}` : "";
        const rems = item.removed.length > 0 ? ` sans ${item.removed.join(", sans ")}` : "";
        script = `<div class="pad-item-desc">"Pizza ${item.id.charAt(0).toUpperCase() + item.id.slice(1)}${adds}${rems}"</div>`;
      }

      return `
        <li>
          <div class="pad-item-info">
            <div class="pad-item-title">
              <span>${qtyText} ${item.name}</span>
              <span class="pad-item-price">${formatPrice(item.price * item.qty)}</span>
            </div>
            ${script}
          </div>
          <div class="pad-item-controls">
            <button class="qty-btn" type="button" data-key="${key}" data-action="minus">-</button>
          </div>
        </li>
      `;
    }).join("");

    padEmpty.hidden = items.length > 0;
    const total = items.reduce((sum, [_, item]) => sum + (item.price * item.qty), 0);
    padTotal.textContent = formatPrice(total);
    const count = items.reduce((sum, [_, item]) => sum + item.qty, 0);
    padCount.textContent = count;
    padToggle.setAttribute("aria-label", `Calepin, ${count} pizzas`);
  };

  const openCustomize = (keyOrId) => {
    let item;
    if (cart[keyOrId]) {
      item = { ...cart[keyOrId], baseId: cart[keyOrId].id };
    } else {
      const base = getBaseItem(keyOrId);
      item = { ...base, baseId: keyOrId, removed: [], added: [] };
    }

    currentCustomizing = { 
      key: cart[keyOrId] ? keyOrId : null,
      baseId: item.baseId, 
      removed: [...item.removed], 
      added: [...item.added],
      originalIngredients: getBaseItem(item.baseId).ingredients
    };

    modalTitle.textContent = `Personnaliser ${item.name}`;
    renderModalLists();
    modal.classList.add("is-open");
    document.body.classList.add("modal-open");
  };

  const renderModalLists = () => {
    const { removed, added, originalIngredients } = currentCustomizing;
    
    // Remove list
    removeList.innerHTML = originalIngredients.map(ing => {
      const isRemoved = removed.includes(ing);
      return `
        <div class="ingredient-item" style="${isRemoved ? 'opacity:0.5' : ''}">
          <span>${ing}</span>
          <button class="remove-ing-btn" type="button" data-toggle-remove="${ing}">${isRemoved ? '+' : '-'}</button>
        </div>
      `;
    }).join("");

    // Add list
    const query = normalize(ingSearch.value);
    addList.innerHTML = ingredientsData
      .filter(ing => !originalIngredients.includes(ing.name))
      .filter(ing => !query || normalize(ing.name).includes(query))
      .map(ing => {
        const isAdded = added.includes(ing.name);
        return `
          <label class="ing-checkbox-item">
            <input type="checkbox" data-toggle-add="${ing.name}" ${isAdded ? 'checked' : ''}>
            <span>${ing.name}</span>
            <span class="ing-price">+${formatPrice(ing.price)}</span>
          </label>
        `;
      }).join("");
  };

  const applyFilters = () => {
    const queryTerms = normalize(search.value).split(/\s+/).filter(Boolean);
    const filterTerms = normalize(activeFilter).split(/\s+/).filter(Boolean);
    let visibleCount = 0;

    document.querySelectorAll(".pizza-card").forEach((card) => {
      const haystack = normalize(card.dataset.keywords + " " + card.textContent);
      const matchesSearch = queryTerms.every((term) => haystack.includes(term));
      const matchesFilter = filterTerms.length === 0 || filterTerms.some((term) => haystack.includes(term));
      const visible = matchesSearch && matchesFilter;
      card.hidden = !visible;
      if (visible && !card.classList.contains("custom-pizza-card")) {
        visibleCount += 1;
      }
    });

    document.querySelectorAll("[data-menu-section]").forEach((section) => {
      const hasVisibleCard = Array.from(section.querySelectorAll(".pizza-card:not(.custom-pizza-card)")).some((card) => !card.hidden);
      section.hidden = !hasVisibleCard;
    });

    resultCount.textContent = `${visibleCount} produit${visibleCount > 1 ? "s" : ""} affiché${visibleCount > 1 ? "s" : ""}`;
  };

  // Events
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (btn) {
      updateQty(btn.dataset.key, btn.dataset.action === "plus" ? 1 : -1);
      return;
    }

    const custBtn = e.target.closest("[data-customize]");
    if (custBtn) {
      openCustomize(custBtn.dataset.customize);
      return;
    }

    const editBtn = e.target.closest("[data-edit-custom]");
    if (editBtn) {
      openCustomize(editBtn.dataset.editCustom);
      return;
    }

    const toggleRem = e.target.closest("[data-toggle-remove]");
    if (toggleRem) {
      const ing = toggleRem.dataset.toggleRemove;
      if (currentCustomizing.removed.includes(ing)) {
        currentCustomizing.removed = currentCustomizing.removed.filter(i => i !== ing);
      } else {
        currentCustomizing.removed.push(ing);
      }
      renderModalLists();
      return;
    }

    const toggleAdd = e.target.closest("[data-toggle-add]");
    if (toggleAdd) {
      const ing = toggleAdd.dataset.toggleAdd;
      if (toggleAdd.checked) {
        if (!currentCustomizing.added.includes(ing)) currentCustomizing.added.push(ing);
      } else {
        currentCustomizing.added = currentCustomizing.added.filter(i => i !== ing);
      }
      renderModalLists();
    }

    if (e.target.closest(".collapse-trigger")) {
      e.target.closest(".collapse-section").classList.toggle("is-open");
    }
  });

  ingSearch.addEventListener("input", renderModalLists);

  saveModal.addEventListener("click", () => {
    const { baseId, removed, added, key: oldKey } = currentCustomizing;
    const base = getBaseItem(baseId);
    const newKey = getCartKey(baseId, removed, added);
    
    let finalQty = 1;
    if (oldKey && cart[oldKey]) {
      finalQty = cart[oldKey].qty;
      if (oldKey !== newKey) delete cart[oldKey];
    }

    if (removed.length === 0 && added.length === 0) {
      updateQty(baseId, finalQty);
    } else {
      const extraPrice = added.reduce((sum, name) => sum + (ingredientsData.find(i => i.name === name)?.price || 0), 0);
      const finalIngredients = base.ingredients.filter(i => !removed.includes(i)).concat(added);
      
      // Smart increment if exists
      if (cart[newKey]) {
        cart[newKey].qty += finalQty;
      } else {
        // Check if a similar custom name already exists to handle "Personnalisée 2"
        let name = generateCustomName(base.name, removed, added);
        if (name.includes("Personnalisée")) {
          let count = 1;
          const others = Object.values(cart).filter(item => item.id === baseId && item.name.startsWith(base.name + " Personnalisée"));
          if (others.length > 0) {
            name = `${base.name} Personnalisée ${others.length + 1}`;
          }
        }

        cart[newKey] = {
          id: baseId,
          name: name,
          price: base.price + extraPrice,
          ingredients: finalIngredients,
          removed: [...removed],
          added: [...added],
          qty: finalQty
        };
      }
      save();
    }
    
    modal.classList.remove("is-open");
    document.body.classList.remove("modal-open");
  });

  const closeM = () => {
    modal.classList.remove("is-open");
    document.body.classList.remove("modal-open");
  };
  closeModal.addEventListener("click", closeM);
  cancelModal.addEventListener("click", closeM);

  search.addEventListener("input", applyFilters);
  padToggle.addEventListener("click", () => {
    pad.classList.toggle("is-open");
    padToggle.setAttribute("aria-expanded", pad.classList.contains("is-open"));
    document.body.classList.toggle("pad-open", pad.classList.contains("is-open"));
  });
  closePad.addEventListener("click", () => {
    pad.classList.remove("is-open");
    document.body.classList.remove("pad-open");
  });
  clearPad.addEventListener("click", () => {
    cart = {};
    save();
  });

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter || "";
      filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      applyFilters();
    });
  });

  renderAll();
})();
