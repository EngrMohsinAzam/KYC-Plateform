# KYX Platform - Identity Verification

A pixel-perfect, fully responsive Next.js 14 web application for identity verification and decentralized ID creation.

## 🚀 Features

- **Identity Verification Flow**: Complete multi-step verification process
- **Decentralized ID Creation**: Blockchain-based anonymous ID generation
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Type Safety**: Full TypeScript implementation
- **State Management**: React Context API for global state
- **Accessibility**: Semantic HTML and ARIA labels

## 🛠️ Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **React Context API** - Global state management

## 📦 Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🏗️ Project Structure

```
├── app/                      # Next.js App Router pages
│   ├── layout.tsx           # Global layout
│   ├── page.tsx             # Landing page
│   ├── verify/              # Identity verification flow
│   └── decentralized-id/    # Decentralized ID creation
├── components/              # Reusable components
│   ├── ui/                  # UI components (Button, Input, etc.)
│   └── layout/              # Layout components (Header, Footer)
├── context/                 # React Context for state management
│   ├── AppContext.tsx
│   ├── AppProvider.tsx
│   └── useAppContext.ts
└── public/                  # Static assets
```

## 🎨 Design System

The design system is configured in `tailwind.config.ts` with:

- **Colors**: Primary, secondary, surface, accent colors
- **Typography**: Inter font family
- **Spacing**: Consistent spacing scale
- **Border Radius**: Card and button radius tokens
- **Shadows**: Card and button shadow tokens

## 📱 Pages

1. **Home** (`/`) - Identity verification introduction
2. **Select ID Type** (`/verify/select-id-type`) - Choose country and ID type
3. **Resident Selection** (`/verify/resident-selection`) - Select residence
4. **Verify Identity** (`/verify/identity`) - Document and selfie options
5. **Upload Document** (`/verify/upload-document`) - Upload ID document
6. **Review** (`/verify/review`) - Under review status
7. **Connect Wallet** (`/decentralized-id/connect`) - Connect wallet for blockstamp
8. **Confirm Blockstamp** (`/decentralized-id/confirm`) - Confirm transaction
9. **Complete** (`/decentralized-id/complete`) - Verification complete

## 🚢 Deployment

This project is optimized for Vercel deployment:

```bash
# Deploy to Vercel
vercel
```

## 📝 License

Private - All rights reserved
