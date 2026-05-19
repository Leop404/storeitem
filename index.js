// ==================== Variables Globales ====================
let productos = [];
let currentCategory = 'all';
let carrito = [];
let productoActual = null;

const contenedor = document.querySelector('.catalog-container');
const searchInput = document.getElementById('search-input');

// ==================== Productos desde Json ====================
async function cargarProductos() {
    try {
        const response = await fetch('productos.json');
        const data = await response.json();
        productos = data.productos;

        mostrarProductos(productos);
        actualizarContadorCarrito();
    } catch (error) {
        console.error("Error cargando productos:", error);
        contenedor.innerHTML = `<p style="color:red; grid-column:1/-1; text-align:center;">Error al cargar los productos.</p>`;
    }
}

function mostrarProductos(productosFiltrados) {
    contenedor.innerHTML = "";

    if (productosFiltrados.length === 0) {
        contenedor.innerHTML = `
            <p style="grid-column: 1 / -1; text-align: center; color: #aaa; padding: 40px;">
                No se encontraron productos que coincidan con tu búsqueda.
            </p>`;
        return;
    }

    productosFiltrados.forEach(producto => {
        const card = document.createElement('div');
        card.classList.add('product-card');

        card.innerHTML = `
            <h3 class="product-title">${producto.nombre}</h3>
            <div class="product-image">
                <img src="${producto.imagen}" alt="${producto.nombre}">
            </div>
            <button class="btn-info" data-id="${producto.id}">+ Info</button>
        `;

        contenedor.appendChild(card);
    });
}

function filtrarProductos() {
    const texto = searchInput.value.toLowerCase().trim();

    let productosFiltrados = productos;

    if (currentCategory !== 'all') {
        productosFiltrados = productosFiltrados.filter(p => p.categoria === currentCategory);
    }

    if (texto !== '') {
        productosFiltrados = productosFiltrados.filter(producto =>
            producto.nombre.toLowerCase().includes(texto) ||
            producto.marca.toLowerCase().includes(texto) ||
            producto.descripcion.toLowerCase().includes(texto)
        );
    }

    mostrarProductos(productosFiltrados);
}

// ==================== Modal ====================
function abrirModal(id) {
    productoActual = productos.find(p => p.id === id);
    if (!productoActual) return;

    const modal = document.getElementById('product-modal');

    document.getElementById('modal-title').innerText = productoActual.nombre;
    document.getElementById('modal-img').src = productoActual.imagen;
    document.getElementById('modal-desc').innerText = productoActual.descripcion;
    document.getElementById('modal-price').innerText = `Precio: $${productoActual.precio.toFixed(2)}`;

    document.getElementById('qty').value = 1;

    modal.style.display = "block";
    setTimeout(() => modal.classList.add('show'), 10);

    document.body.style.overflow = "hidden";
    document.querySelector('.navbar').style.display = "none";
}

function cerrarModal() {
    const modal = document.getElementById('product-modal');
    modal.classList.remove('show');

    setTimeout(() => {
        modal.style.display = "none";
        document.body.style.overflow = "visible";
        document.querySelector('.navbar').style.display = "flex";
    }, 350);
}

function filtrarPorCategoria(category) {
    currentCategory = category;

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-category') === category);
    });

    const textoBusqueda = searchInput.value.toLowerCase().trim();

    let productosFiltrados = productos;

    if (category !== 'all') {
        productosFiltrados = productosFiltrados.filter(p => p.categoria === category);
    }

    if (textoBusqueda) {
        productosFiltrados = productosFiltrados.filter(p =>
            p.nombre.toLowerCase().includes(textoBusqueda) ||
            p.descripcion.toLowerCase().includes(textoBusqueda)
        );
    }

    mostrarProductos(productosFiltrados);
}

// ==================== Carrito ====================

function cargarCarrito() {
    const carritoGuardado = localStorage.getItem('carrito');
    if (carritoGuardado) {
        carrito = JSON.parse(carritoGuardado);
    }
}

function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

function agregarAlCarrito(id) {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;

    const existente = carrito.find(item => item.id === id);

    if (existente) {
        existente.cantidad += 1;
    } else {
        carrito.push({ ...producto, cantidad: 1 });
    }

    guardarCarrito();
    actualizarContadorCarrito();
}

function actualizarContadorCarrito() {
    const countElement = document.getElementById('cart-count');
    if (countElement) {
        const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
        countElement.textContent = totalItems;
    }
}

function getTotalCarrito() {
    return carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
}

function renderCartModal() {
    const container = document.getElementById('cart-items');
    const totalElement = document.getElementById('cart-total-amount');
    const cartTotalSection = document.querySelector('.cart-total');

    if (carrito.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding: 60px 20px; color:#ffffff;">
                <h3>Tu carrito está vacío</h3>
                <p>¡Agrega algunos productos increíbles!</p>
            </div>`;

        if (totalElement) totalElement.parentElement.style.display = "none";
        document.querySelector('.cart-buttons').style.display = "none";
        return;
    }

    if (totalElement) totalElement.parentElement.style.display = "block";
    document.querySelector('.cart-buttons').style.display = "flex";

    let html = '';

    carrito.forEach((item, index) => {
        html += `
            <div class="cart-item">
                <img src="${item.imagen}" alt="${item.nombre}">
                <div class="cart-item-info">
                    <h4>${item.nombre}</h4>
                    <p>$${item.precio.toFixed(2)} c/u</p>
                </div>
                <div class="cart-quantity">
                    <button onclick="cambiarCantidad(${index}, -1)">–</button>
                    <span style="min-width: 24px; text-align:center;">${item.cantidad}</span>
                    <button onclick="cambiarCantidad(${index}, 1)">+</button>
                </div>
                <div style="margin-left: auto; font-weight: bold; color:#00ff40;">
                    $${(item.precio * item.cantidad).toFixed(2)}
                </div>
                <button onclick="eliminarDelCarrito(${index})" style="margin-left: 20px; color: #ff5555; font-size: 22px; background:none; border:none; cursor:pointer;">×</button>
            </div>
        `;
    });

    container.innerHTML = html;
    totalElement.textContent = getTotalCarrito().toFixed(2);
}

window.cambiarCantidad = function (index, change) {
    carrito[index].cantidad += change;
    if (carrito[index].cantidad < 1) carrito[index].cantidad = 1;
    guardarCarrito();
    renderCartModal();
    actualizarContadorCarrito();
};

window.eliminarDelCarrito = function (index) {
    carrito.splice(index, 1);
    guardarCarrito();
    renderCartModal();
    actualizarContadorCarrito();
};

function abrirCarrito() {
    renderCartModal();
    document.getElementById('cart-modal').style.display = "block";
    setTimeout(() => {
        document.getElementById('cart-modal').classList.add('show');
    }, 10);

    document.body.style.overflow = "hidden";
    document.querySelector('.navbar').style.display = "none";
}

// ==================== Eventos ====================
document.addEventListener('DOMContentLoaded', () => {

    cargarProductos();
    cargarCarrito();

    contenedor.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-info')) {
            const id = parseInt(e.target.dataset.id);
            if (id) abrirModal(id);
        }
    });

    // Eventos de los filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            filtrarPorCategoria(btn.getAttribute('data-category'));
        });
    });

    // Buscador en tiempo real
    searchInput.addEventListener('input', filtrarProductos);

    // Eventos del modal
    const modal = document.getElementById('product-modal');
    const closeBtn = document.querySelector('.close-modal');

    closeBtn.addEventListener('click', cerrarModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrarModal();
    });

    // Botones de cantidad
    document.getElementById('plus').addEventListener('click', () => {
        const qty = document.getElementById('qty');
        qty.value = parseInt(qty.value) + 1;
    });

    document.getElementById('minus').addEventListener('click', () => {
        const qty = document.getElementById('qty');
        let current = parseInt(qty.value);
        if (current > 1) qty.value = current - 1;
    });

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape" && modal.style.display === "block") {
            cerrarModal();
        }
    });

    // Evento para añadir desde el modal
    const btnAddCart = document.getElementById('btn-add-to-cart');
    if (btnAddCart) {
        btnAddCart.addEventListener('click', () => {
            if (productoActual) {
                const cantidadSeleccionada = parseInt(document.getElementById('qty').value) || 1;

                for (let i = 0; i < cantidadSeleccionada; i++) {
                    agregarAlCarrito(productoActual.id);
                }
                cerrarModal();
            }
        });
    }

    // Evento del icono del carrito
    const cartIcon = document.getElementById('cart-icon');
    if (cartIcon) {
        cartIcon.addEventListener('click', abrirCarrito);
    }

    // Actualizar contador cuando cargue la página
    actualizarContadorCarrito();


    // Eventos del modal del carrito
    const cartModal = document.getElementById('cart-modal');
    const closeCartBtn = document.getElementById('close-cart-modal');

    function cerrarCarrito() {
        cartModal.classList.remove('show');

        setTimeout(() => {
            cartModal.style.display = "none";

            document.body.style.overflow = "visible";
            document.querySelector('.navbar').style.display = "flex";
        }, 350);
    }

    closeCartBtn.addEventListener('click', cerrarCarrito);

    cartModal.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            cerrarCarrito();
        }
    });

    // Botón Vaciar Carrito
    document.getElementById('btn-clear-cart').addEventListener('click', () => {
        Swal.fire({
            title: "¿Vaciar carrito?",
            text: "Esta acción no se puede deshacer",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ff5555",
            cancelButtonColor: "#666",
            confirmButtonText: "Sí, vaciar",
            cancelButtonText: "Cancelar"
        }).then((result) => {
            if (result.isConfirmed) {
                carrito = [];
                guardarCarrito();
                renderCartModal();
                actualizarContadorCarrito();

                Swal.fire({
                    title: "Carrito vaciado",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
    });

    // Botón Pago
    document.getElementById('btn-checkout').addEventListener('click', () => {

        Swal.fire({
            title: "¡Compra realizada!",
            html: `Total pagado: <strong>$${getTotalCarrito().toFixed(2)}</strong>`,
            icon: "success",
            confirmButtonText: "Genial!",
            confirmButtonColor: "#00ff40",
            background: "#181818",
            color: "#ffffff"
        });

        // Limpiar el carrito
        carrito = [];
        guardarCarrito();

        // Cerrar el modal del carrito
        const cartModal = document.getElementById('cart-modal');
        cartModal.classList.remove('show');
        setTimeout(() => {
            cartModal.style.display = "none";
        }, 350);

        actualizarContadorCarrito();
        cerrarCarrito();
    });

});