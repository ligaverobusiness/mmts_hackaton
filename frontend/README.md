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

Los archivos `.env` ya están configurados en el repositorio con las addresses de los contratos desplegados. No es necesario modificar nada para correr el proyecto y aquí se podrán encontrar las direcciones de los contratos desplegados en Testnet Bradbury.

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
