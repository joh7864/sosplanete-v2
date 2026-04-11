---
name: testing
description: Guide complet pour écrire des tests robustes avec Vitest et Testing Library.
---

# Testing Standards - Vitest & RTL

## 🎯 Philosophie "Test-First"
* **Écrire le test** avant ou pendant l'implémentation.
* **Ne pas tester** les détails d'implémentation (ex: état interne), tester le **comportement** (ce que l'utilisateur voit).
* **Isolation** : Mocker les dépendances externes (API, DB, Navigation).

## 1. Structure d'un Test (.test.tsx)
```typescript
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MyComponent } from "./MyComponent";

// Mocks globaux ou locaux
vi.mock("@/lib/db", () => ({ ... }));

describe("MyComponent Logic", () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it("should render correctly in default state", () => {
        render(<MyComponent />);
        expect(screen.getByText("Titre")).toBeInTheDocument();
    });

    it("should handle user interaction", async () => {
        const onAction = vi.fn();
        render(<MyComponent onAction={onAction} />);
        
        fireEvent.click(screen.getByRole("button", { name: /Valider/i }));
        
        await waitFor(() => {
            expect(onAction).toHaveBeenCalledWith("data");
        });
    });
});
```

## 2. Quoi Mocker ?
* **Next.js** : `next/navigation` (`useRouter`, `useSearchParams`), `next/image` (voir setup).
* **DB & API** : `dexie` (`db.leads.add`), appels `fetch`.
* **Toast/Contexts** : `useToast`, providers globaux.

## 3. Bonnes Pratiques
* **Queries** : Préférer `getByRole` > `getByText` > `getByTestId`.
* **Async** : Utiliser `findBy...` ou `waitFor` pour les éléments qui apparaissent après un délai.
* **Events** : `fireEvent` pour les interactions simples, `userEvent` (si configuré) pour plus de réalisme.
* **Coverage** : Viser > 80% sur la logique métier critique.

## 4. Commandes
* `npm test` : Lancer tous les tests.
* `npm test components/ui` : Lancer un scope précis.
* `npm run test:coverage` : Rapport de couverture.
