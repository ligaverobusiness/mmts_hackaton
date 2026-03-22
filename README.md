## Integrantes

Mayerli Quintuña, María de los Ángeles Contreras, Tamara Serpa, Sebastián Tapia

## Requisitos previos

- Node.js v18 o superior
- MetaMask instalado en el navegador
- ETH de Sepolia: https://sepoliafaucet.com
- USDC de Sepolia: https://faucet.circle.com (seleccionar Ethereum Sepolia)

---

## Instalación

### Backend

```bash
cd backend
npm install
node server.js
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Abrir `http://localhost:5173` en el navegador.

---

## Variables de entorno

Los archivos .env ya se encuentran configurados dentro del repositorio e incluyen las direcciones de los contratos previamente desplegados. Por lo tanto, no es necesario realizar modificaciones adicionales para ejecutar el proyecto. En estos archivos se pueden consultar las direcciones correspondientes a los contratos desplegados en la Testnet Bradbury.

Adicionalmente, cualquier nuevo contrato que se genere podrá visualizarse mediante el enlace "On-Chain", disponible dentro de la aplicación.

### `backend/.env`

```
PORT=4000
FRONTEND_URL=http://localhost:5173
RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
WORK_FACTORY_ADDRESS=...
BET_FACTORY_ADDRESS=...
CIVICO_FACTORY_ADDRESS=...
USDC_ADDRESS=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
PINATA_JWT=...
DEPLOYER_PRIVATE_KEY=...
```

### `frontend/.env`

```
VITE_API_URL=http://localhost:4000
VITE_WORK_FACTORY_ADDRESS=...
VITE_BET_FACTORY_ADDRESS=...
VITE_CIVICO_FACTORY_ADDRESS=...
VITE_USDC_ADDRESS=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
VITE_GENLAYER_WORK_VALIDATOR=...
VITE_GENLAYER_BET_ORACLE=...
```

### Consideraciones para la Web (Prototipo)

Se recomienda establecer un precio entre $0.01 - $0.02 en las operaciones para su facilidad.
Las transacciones en MetaMask pueden tardar algunos segundos en completarse (contratos, apuestas y procesos cívicos). Además, la aplicación solicita dos confirmaciones, por lo que es normal percibir una breve espera; esto no indica que la página esté congelada.
La plataforma funciona únicamente cuando MetaMask está conectado a la red Sepolia (Ethereum).
Se reconoce que la exposición pública de los archivos .env representa un riesgo en términos de ciberseguridad; sin embargo, esto se ha realizado intencionalmente para facilitar la clonación y ejecución del repositorio. Cabe destacar que las direcciones, contratos y wallets incluidos son destinados a proyectos y no corresponden a información personal.
