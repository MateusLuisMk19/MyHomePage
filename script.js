// Adicionar funcionalidade de pesquisa
document.querySelector("input").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    const searchTerm = this.value;
    if (searchTerm) {
      window.location.href = `https://www.google.com/search?q=${encodeURIComponent(
        searchTerm
      )}`;
    }
  }
});

// Função para carregar os atalhos do arquivo JSON
async function loadShortcuts() {
  try {
    const shortcuts = localStorage.getItem("shortcuts");
    return shortcuts ? JSON.parse(shortcuts) : [];
  } catch (error) {
    console.error("Erro ao carregar atalhos:", error);
    return [];
  }
}

// Função para salvar os atalhos no localStorage
function saveShortcuts(shortcuts) {
  try {
    // Atualiza os índices dos atalhos
    shortcuts = shortcuts.map((shortcut, index) => ({ ...shortcut, index }));
    localStorage.setItem("shortcuts", JSON.stringify(shortcuts));
    return true;
  } catch (error) {
    console.error("Erro ao salvar atalhos:", error);
    return false;
  }
}

// Função para carregar os atalhos iniciais do arquivo json
async function loadInitialShortcuts() {
  if (!localStorage.getItem("shortcuts")) {
    try {
      const response = await fetch("shortcuts.json");
      const shortcuts = await response.json();
      saveShortcuts(shortcuts);
    } catch (error) {
      console.error("Erro ao carregar atalhos iniciais:", error);
    }
  }
}

// Função para extrair o domínio de uma URL
function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

// Função para obter o favicon de um site
function getFaviconUrl(url) {
  const domain = getDomain(url);
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

// Funções de drag and drop
function dragStart(e) {
  e.dataTransfer.setData("text/plain", e.target.getAttribute("data-index"));
  e.target.style.opacity = "0.5";
}

function dragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
}

function dragEnter(e) {
  e.preventDefault();
  e.currentTarget.classList.add("bg-white/20");
}

function dragLeave(e) {
  e.currentTarget.classList.remove("bg-white/20");
}

function drop(e) {
  e.preventDefault();
  const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
  const toIndex = parseInt(e.currentTarget.getAttribute("data-index"));

  if (fromIndex === toIndex) return;

  reorderShortcuts(fromIndex, toIndex);
}

async function reorderShortcuts(fromIndex, toIndex) {
  const shortcuts = await loadShortcuts();
  const [movedShortcut] = shortcuts.splice(fromIndex, 1);
  shortcuts.splice(toIndex, 0, movedShortcut);

  if (await saveShortcuts(shortcuts)) {
    await createShortcuts();
  } else {
    alert("Erro ao reorganizar os atalhos. Tente novamente.");
  }
}

// Função para criar os atalhos dinamicamente
async function createShortcuts() {
  const container = document.querySelector(".shortcuts");
  container.innerHTML = ""; // Limpa o container

  const shortcuts = await loadShortcuts();

  // Adiciona os atalhos existentes
  shortcuts.forEach((shortcut, index) => {
    const shortcutElement = document.createElement("div");
    shortcutElement.className =
      "flex flex-col items-center cursor-grabbing group h-24 w-24 mx-5 hover:bg-white/10 relative p-1 rounded-lg";
    shortcutElement.draggable = true;
    shortcutElement.setAttribute("data-index", index);

    shortcutElement.innerHTML += `
        <div class="absolute w-4 h-5 top-0 right-1 text-center cursor-pointer text-transparent z-10 hover:text-gray-300" onclick="dropdown('${
          shortcut.name
        }')">:</div>
        <a href="${
          shortcut.link
        }" class="flex flex-col items-center cursor-pointer group p-2 rounded-lg">
          <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-2 text-white overflow-hidden">
            <img src="${getFaviconUrl(shortcut.link)}" 
              alt="${shortcut.name}" 

              class="w-6 h-6 object-contain"
              onerror="this.onerror=null; this.innerHTML='${shortcut.icon}'">
          </div>
          <span class="text-white text-sm text-nowrap">${shortcut.name}</span>
        </a>
    `;

    shortcutElement.addEventListener("dragstart", dragStart);
    shortcutElement.addEventListener("dragover", dragOver);
    shortcutElement.addEventListener("drop", drop);
    shortcutElement.addEventListener("dragenter", dragEnter);
    shortcutElement.addEventListener("dragleave", dragLeave);

    container.appendChild(shortcutElement);
  });

  // Adiciona o botão de "Adicionar Atalho"
  container.innerHTML += `
    <div onclick="showAddShortcutForm()" class="flex flex-col h-24 w-24 items-center cursor-pointer group hover:bg-white/10 relative p-1 rounded-lg">
      <div class="flex flex-col items-center cursor-pointer group p-2 rounded-lg">  
        <div class="w-12 h-12 bg-white rounded-full text-gray-500 flex items-center justify-center mb-2  group-hover:text-lg">
         <i class="fa fa-plus" aria-hidden="true"></i>
        </div>
        <span class="text-white text-sm">Adicionar</span>
      </div>
    </div>
  `;
}

// Função para mostrar o dropdown
function dropdown(shortcutName) {
  // Remove qualquer dropdown existente
  const existingDropdown = document.querySelector(".dropdown-menu");
  if (existingDropdown) {
    existingDropdown.remove();
  }

  // Encontra o elemento que foi clicado
  const element = document.querySelector(
    `[onclick="dropdown('${shortcutName}')"]`
  );

  // Cria o menu dropdown
  const dropdownMenu = document.createElement("div");
  dropdownMenu.className =
    "dropdown-menu absolute right-0 mt-6 w-32 bg-white rounded-lg shadow-lg z-20";
  dropdownMenu.innerHTML = `
    <div class="py-1">
      <button onclick="editShortcut('${shortcutName}')" 
              class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
        Editar
      </button>
      <button onclick="deleteShortcut('${shortcutName}')" 
              class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
        Eliminar
      </button>
    </div>
  `;

  // Adiciona o dropdown ao elemento pai
  element.parentElement.appendChild(dropdownMenu);

  // Fecha o dropdown quando clicar fora dele
  document.addEventListener("click", function closeDropdown(e) {
    if (!dropdownMenu.contains(e.target) && e.target !== element) {
      dropdownMenu.remove();
      document.removeEventListener("click", closeDropdown);
    }
  });
}

// Função para editar atalho
async function editShortcut(shortcutName) {
  const shortcuts = await loadShortcuts();
  const shortcut = shortcuts.find((s) => s.name === shortcutName);

  if (!shortcut) return;

  const form = document.createElement("div");
  form.className =
    "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center";
  form.innerHTML = `
    <div class="bg-white p-6 rounded-lg">
      <h2 class="text-xl mb-4">Editar Atalho</h2>
      <input type="text" id="shortcutName" value="${
        shortcut.name
      }" placeholder="Nome" class="block w-full mb-2 p-2 border rounded">
      <input type="url" id="shortcutLink" value="${
        shortcut.link
      }" placeholder="URL" class="block w-full mb-4 p-2 border rounded">
      <div class="preview-icon mb-4 flex items-center">
        <span class="mr-2">Ícone:</span>
        <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
          <img id="iconPreview" src="${getFaviconUrl(
            shortcut.link
          )}" class="w-6 h-6 object-contain" alt="">
        </div>
      </div>
      <div class="flex justify-end space-x-2">
        <button onclick="this.parentElement.parentElement.parentElement.remove()" class="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
        <button onclick="saveEdit('${shortcutName}')" class="px-4 py-2 bg-blue-500 text-white rounded">Salvar</button>
      </div>
    </div>
  `;
  document.body.appendChild(form);

  // Adiciona preview do ícone quando URL é alterada
  const linkInput = document.getElementById("shortcutLink");
  const iconPreview = document.getElementById("iconPreview");
  linkInput.addEventListener("input", () => {
    if (linkInput.value) {
      iconPreview.src = getFaviconUrl(linkInput.value);
    }
  });
}

// Função para salvar edição
async function saveEdit(oldName) {
  const name = document.getElementById("shortcutName").value;
  const link = document.getElementById("shortcutLink").value;

  if (name && link) {
    const shortcuts = await loadShortcuts();
    const index = shortcuts.findIndex((s) => s.name === oldName);

    if (index !== -1) {
      shortcuts[index] = {
        name,
        icon: name.charAt(0).toUpperCase(),
        link,
      };

      if (await saveShortcuts(shortcuts)) {
        await createShortcuts();
        document.querySelector(".fixed").remove();
      } else {
        alert("Erro ao salvar as alterações. Tente novamente.");
      }
    }
  }
}

// Função para deletar atalho
async function deleteShortcut(shortcutName) {
  if (confirm(`Tem certeza que deseja eliminar o atalho "${shortcutName}"?`)) {
    const shortcuts = await loadShortcuts();
    const filteredShortcuts = shortcuts.filter((s) => s.name !== shortcutName);

    if (await saveShortcuts(filteredShortcuts)) {
      await createShortcuts();
    } else {
      alert("Erro ao eliminar o atalho. Tente novamente.");
    }
  }
}

// Função para mostrar o formulário de adicionar atalho
function showAddShortcutForm() {
  const form = document.createElement("div");
  form.className =
    "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center";
  form.innerHTML = `
        <div class="bg-white p-6 rounded-lg">
            <h2 class="text-xl mb-4">Adicionar Novo Atalho</h2>
            <input type="text" id="shortcutName" placeholder="Nome" class="block w-full mb-2 p-2 border rounded">
            <input type="url" id="shortcutLink" placeholder="URL" class="block w-full mb-4 p-2 border rounded">
            <div class="preview-icon mb-4 flex items-center">
                <span class="mr-2">Ícone:</span>
                <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    <img id="iconPreview" class="w-6 h-6 object-contain" alt="">
                </div>
            </div>
            <div class="flex justify-end space-x-2">
                <button onclick="this.parentElement.parentElement.parentElement.remove()" class="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                <button onclick="addNewShortcut()" class="px-4 py-2 bg-blue-500 text-white rounded">Adicionar</button>
            </div>
        </div>
    `;
  document.body.appendChild(form);

  // Adiciona preview do ícone quando URL é digitada
  const linkInput = document.getElementById("shortcutLink");
  const iconPreview = document.getElementById("iconPreview");
  linkInput.addEventListener("input", () => {
    if (linkInput.value) {
      iconPreview.src = getFaviconUrl(linkInput.value);
    }
  });
}

// Função para adicionar novo atalho
async function addNewShortcut() {
  const name = document.getElementById("shortcutName").value;
  const link = document.getElementById("shortcutLink").value;

  if (name && link) {
    const shortcuts = await loadShortcuts();
    const icon = name.charAt(0).toUpperCase();
    shortcuts.push({ name, icon, link });

    if (await saveShortcuts(shortcuts)) {
      await createShortcuts();
      document.querySelector(".fixed").remove();
    } else {
      alert("Erro ao salvar o atalho. Tente novamente.");
    }
  }
}

// Inicializar quando a página carregar
document.addEventListener("DOMContentLoaded", async () => {
  await loadInitialShortcuts();
  await createShortcuts();
  loadBackgroundPreference();
});

// Função para abrir a offcanvas de edição de fundo
function openBackgroundEditor() {
  const offcanvas = document.createElement("div");
  offcanvas.className =
    "fixed inset-y-0 right-0 w-80 z-50 bg-white shadow-lg transform transition-transform duration-300 translate-x-full overflow-y-auto";
  offcanvas.id = "backgroundEditor";

  offcanvas.innerHTML = `
      <div class="p-6">
          <div class="flex justify-between items-center mb-6">
              <h2 class="text-xl font-semibold">Personalizar fundo</h2>
              <button onclick="closeBackgroundEditor()" class="text-gray-500 hover:text-gray-700">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
              </button>
          </div>
          
          <div class="space-y-6">
              <!-- Imagem de fundo -->
              <div>
                  <h3 class="text-sm font-medium text-gray-700 mb-2">Imagem de fundo</h3>
                  <div class="space-y-2">
                      <input type="file" 
                             accept="image/*" 
                             onchange="setBackgroundImage(this.files[0])"
                             class="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-blue-50 file:text-blue-700
                                    hover:file:bg-blue-100">
                      <div class="text-xs text-gray-500">
                          Tamanho máximo recomendado: 2MB
                      </div>
                  </div>
              </div>

              <!-- Gradiente personalizado -->
              <div>
                  <h3 class="text-sm font-medium text-gray-700 mb-2">Gradiente personalizado</h3>
                  <div class="space-y-3">
                      <div class="flex items-center space-x-2">
                          <input type="color" value='#ffffff' id="gradientStart" class="w-8 h-8 rounded cursor-pointer">
                          <input type="color" value='#000000' id="gradientEnd" class="w-8 h-8 rounded cursor-pointer">
                          <label for="gradientReverse" class="flex items-center cursor-pointer">
                              <input type="checkbox" id="gradientReverse" onclick="setCustomGradient()"  class="hidden">
                              <i class="fa fa-refresh text-gray-500 hover:text-gray-700"></i>
                          </label>
                      </div>
                      <button onclick="setCustomGradient()" 
                              class="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                          Aplicar gradiente
                      </button>
                  </div>
              </div>

              <!-- Gradientes predefinidos -->
              <div>
                  <h3 class="text-sm font-medium text-gray-700 mb-2">Gradientes predefinidos</h3>
                  <div class="grid grid-cols-2 gap-2">
                      <button onclick="setGradient('from-teal-700 to-pink-200')" 
                              class="h-20 rounded-lg bg-gradient-to-t from-teal-700 to-pink-200">
                      </button>
                      <button onclick="setGradient('from-blue-700 to-purple-200')" 
                              class="h-20 rounded-lg bg-gradient-to-t from-blue-700 to-purple-200">
                      </button>
                      <button onclick="setGradient('from-green-700 to-yellow-200')" 
                              class="h-20 rounded-lg bg-gradient-to-t from-green-700 to-yellow-200">
                      </button>
                      <button onclick="setGradient('from-purple-700 to-red-200')" 
                              class="h-20 rounded-lg bg-gradient-to-t from-purple-700 to-red-200">
                      </button>
                  </div>
              </div>

              <!-- Cores sólidas -->
              <div>
                  <h3 class="text-sm font-medium text-gray-700 mb-2">Cores sólidas</h3>
                  <div class="grid grid-cols-4 gap-2">
                      <button onclick="setSolidColor('bg-blue-700')" class="w-12 h-12 rounded-lg bg-blue-700"></button>
                      <button onclick="setSolidColor('bg-green-700')" class="w-12 h-12 rounded-lg bg-green-700"></button>
                      <button onclick="setSolidColor('bg-purple-700')" class="w-12 h-12 rounded-lg bg-purple-700"></button>
                      <button onclick="setSolidColor('bg-red-700')" class="w-12 h-12 rounded-lg bg-red-700"></button>
                      <button onclick="setSolidColor('bg-yellow-500')" class="w-12 h-12 rounded-lg bg-yellow-500"></button>
                      <button onclick="setSolidColor('bg-pink-600')" class="w-12 h-12 rounded-lg bg-pink-600"></button>
                      <button onclick="setSolidColor('bg-indigo-700')" class="w-12 h-12 rounded-lg bg-indigo-700"></button>
                      <button onclick="setSolidColor('bg-gray-800')" class="w-12 h-12 rounded-lg bg-gray-800"></button>
                  </div>
              </div>

              <!-- Cor personalizada -->
              <div>
                  <h3 class="text-sm font-medium text-gray-700 mb-2">Cor personalizada</h3>
                  <input type="color" 
                         onchange="setCustomColor(this.value)"
                         class="w-10 h-10 rounded cursor-pointer">
              </div>
          </div>
      </div>
  `;

  document.body.appendChild(offcanvas);

  setTimeout(() => {
    offcanvas.classList.remove("translate-x-full");
  }, 10);

  const overlay = document.createElement("div");
  overlay.className = "fixed inset-0 bg-black bg-opacity-50 transition-opacity";
  overlay.id = "backgroundEditorOverlay";
  overlay.onclick = closeBackgroundEditor;
  document.body.appendChild(overlay);
}

// Função para fechar a offcanvas
function closeBackgroundEditor() {
  const offcanvas = document.getElementById("backgroundEditor");
  const overlay = document.getElementById("backgroundEditorOverlay");

  offcanvas.classList.add("translate-x-full");
  overlay.classList.add("opacity-0");

  setTimeout(() => {
    offcanvas.remove();
    overlay.remove();
  }, 300);
}

// Função para salvar preferência de fundo no localStorage
function saveBackgroundPreference(preference) {
  try {
    localStorage.setItem("backgroundPreference", JSON.stringify(preference));
  } catch (error) {
    console.error("Erro ao salvar preferência de fundo:", error);
  }
}

// Função para carregar preferência de fundo do localStorage
function loadBackgroundPreference() {
  try {
    const preference = JSON.parse(localStorage.getItem("backgroundPreference"));
    if (preference) {
      const body = document.body;
      switch (preference.type) {
        case "gradient":
          setGradient(preference.value);
          break;
        case "customGradient":
          body.style.backgroundImage = `linear-gradient(to top, ${preference.value.startColor}, ${preference.value.endColor})`;
          break;
        case "solid":
          setSolidColor(preference.value);
          break;
        case "custom":
          setCustomColor(preference.value);
          break;
        case "image":
          body.style.backgroundImage = `url(${preference.value})`;
          body.style.backgroundSize = "cover";
          body.style.backgroundPosition = "center";
          break;
      }
    }
  } catch (error) {
    console.error("Erro ao carregar preferência de fundo:", error);
  }
}

// Função para aplicar gradiente
function setGradient(gradientClasses) {
  const body = document.body;
  // Remove classes anteriores
  body.className = body.className.replace(
    /bg-gradient-to-t from-\w+-\d+ to-\w+-\d+|bg-\w+-\d+/,
    ""
  );
  // Remove cor personalizada
  body.removeAttribute("style");

  // Adiciona novo gradiente
  body.classList.add("bg-gradient-to-t", ...gradientClasses.split(" "));
  saveBackgroundPreference({ type: "gradient", value: gradientClasses });
}

// Função para aplicar cor sólida
function setSolidColor(colorClass) {
  const body = document.body;
  // Remove classes anteriores
  body.className = body.className.replace(
    /bg-gradient-to-t from-\w+-\d+ to-\w+-\d+|bg-\w+-\d+/,
    ""
  );
  // Remove cor personalizada
  body.removeAttribute("style");

  // Adiciona nova cor
  body.classList.add(colorClass);
  saveBackgroundPreference({ type: "solid", value: colorClass });
}

// Função para aplicar cor personalizada
function setCustomColor(color) {
  const body = document.body;
  // Remove classes anteriores
  body.className = body.className.replace(
    /bg-gradient-to-t from-\w+-\d+ to-\w+-\d+|bg-\w+-\d+/,
    ""
  );
  body.removeAttribute("style");
  // Aplica cor personalizada
  body.style.backgroundColor = color;
  saveBackgroundPreference({ type: "custom", value: color });
}

// Função para definir gradiente personalizado
function setCustomGradient() {
  const gradientReverse = document.getElementById("gradientReverse").checked;
  const startColor = document.getElementById("gradientStart").value;
  const endColor = document.getElementById("gradientEnd").value;
  const body = document.body;

  // Remove classes e estilos anteriores
  body.className = body.className.replace(
    /bg-gradient-to-t from-\w+-\d+ to-\w+-\d+|bg-\w+-\d+/,
    ""
  );
  body.style.backgroundColor = "";
  if (gradientReverse)
    body.style.backgroundImage = `linear-gradient(to top, ${endColor}, ${startColor})`;
  else
    body.style.backgroundImage = `linear-gradient(to top, ${startColor}, ${endColor})`;

  saveBackgroundPreference({
    type: "customGradient",
    value: { startColor, endColor },
  });
}

// Função para definir imagem de fundo
function setBackgroundImage(file) {
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const body = document.body;
      // Remove classes e estilos anteriores
      body.className = body.className.replace(
        /bg-gradient-to-t from-\w+-\d+ to-\w+-\d+|bg-\w+-\d+/,
        ""
      );
      body.style.backgroundColor = "";
      body.style.backgroundImage = `url(${e.target.result})`;
      body.style.backgroundSize = "cover";
      body.style.backgroundPosition = "center";

      saveBackgroundPreference({
        type: "image",
        value: e.target.result,
      });
    };
    reader.readAsDataURL(file);
  }
}
