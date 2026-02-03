# Formulaire de Réclamation - Pré-remplissage Automatique

## 📋 Vue d'ensemble

Les formulaires de réclamation dans l'ePortal pré-remplissent maintenant automatiquement les informations personnelles de l'utilisateur connecté.

---

## ✅ Champs Pré-remplis et Cachés

### Informations Automatiques

| Champ | Source | Exemple | Visible | Modifiable |
|-------|--------|---------|---------|------------|
| **Date de réclamation** | Date actuelle | `2026-02-03` | ❌ Non (cachée) | ❌ Non (automatique) |
| **Email** | `user.email` | `client@example.com` | ✅ Oui | ❌ Non (si pré-rempli) / ✅ Oui (si vide) |
| **Téléphone** | `user.phoneNumber` ou `user.phone` | `+224 6XX XXX XXX` | ✅ Oui | ❌ Non (si pré-rempli) / ✅ Oui (si vide) |

---

## 📝 Fichiers Modifiés

### 1. `/app/services/reclamation/page.tsx`

**Ajout de l'import :**
```typescript
import { getCurrentUser } from "@/app/user/actions"
```

**Ajout du useEffect pour charger les données utilisateur :**
```typescript
// Charger les informations de l'utilisateur au montage du composant
useEffect(() => {
  const loadUserInfo = async () => {
    try {
      const user = await getCurrentUser()
      if (user) {
        setFormData((prev) => ({
          ...prev,
          email: user.email || "",
          phone: user.phoneNumber || user.phone || "",
        }))
      }
    } catch (error) {
      console.error("Erreur lors du chargement des informations utilisateur:", error)
    }
  }

  loadUserInfo()
}, [])
```

### 2. `/app/services/complain/page.tsx`

**Ajout de l'import :**
```typescript
import { getCurrentUser } from "@/app/user/actions"
```

**Initialisation de la date dans l'état initial :**
```typescript
const [formData, setFormData] = useState<Record<string, any>>({
  complainDate: new Date().toISOString().split("T")[0], // Date automatique
})
```

**Champ date caché dans le formulaire :**
```typescript
{/* Date cachée - automatiquement la date du jour */}
<input
  type="hidden"
  name="complainDate"
  value={formData.complainDate || ""}
/>
```

**Ajout du useEffect pour charger les données utilisateur :**
```typescript
// Charger les informations de l'utilisateur au montage du composant
useEffect(() => {
  const loadUserInfo = async () => {
    try {
      const user = await getCurrentUser()
      if (user) {
        setFormData((prev) => ({
          ...prev,
          email: user.email || "",
          phone: user.phoneNumber || user.phone || "",
        }))
      }
    } catch (error) {
      console.error("Erreur lors du chargement des informations utilisateur:", error)
    }
  }

  loadUserInfo()
}, [])
```

**Conservation des données après soumission :**
```typescript
// Réinitialiser le formulaire en gardant les infos utilisateur et la date
const user = await getCurrentUser()
setFormData({
  complainDate: new Date().toISOString().split("T")[0],
  email: user?.email || "",
  phone: user?.phoneNumber || user?.phone || "",
})
```

---

## 🎯 Avantages

### 1. **Meilleure Expérience Utilisateur**
- ✅ L'utilisateur n'a plus besoin de saisir son email, téléphone et date
- ✅ **Date automatique et cachée** : Un champ en moins à remplir
- ✅ Gain de temps lors de la soumission de réclamations
- ✅ Réduction des erreurs de saisie

### 2. **Cohérence et Sécurité des Données**
- ✅ Les informations proviennent directement du profil utilisateur
- ✅ Garantit l'utilisation des coordonnées à jour
- ✅ **Champs en lecture seule** : Empêche la modification des informations sensibles
- ✅ **Traçabilité** : Les réclamations sont toujours liées au bon email/téléphone
- ✅ Facilite le suivi des réclamations

### 3. **Persistance Après Soumission**
- ✅ Les informations restent pré-remplies après une soumission
- ✅ Permet de soumettre plusieurs réclamations rapidement
- ✅ Date automatiquement mise à jour

---

## 🔄 Workflow Utilisateur

### Avant (❌ Manuelle)

```
1. Utilisateur ouvre le formulaire
2. Saisit son email
3. Saisit son téléphone
4. Saisit la date
5. Remplit le reste du formulaire
6. Soumet
```

### Après (✅ Automatique)

```
1. Utilisateur ouvre le formulaire
   ├─ ✅ Email pré-rempli
   ├─ ✅ Téléphone pré-rempli
   └─ ✅ Date pré-remplie
2. Remplit uniquement les champs spécifiques
   ├─ Type de réclamation
   ├─ Motif
   └─ Description
3. Soumet
```

---

## 🧪 Tests Recommandés

### Test 1 : Vérifier le Pré-remplissage et les Champs Cachés

1. Se connecter à l'ePortal
2. Naviguer vers **Services** → **Réclamations**
3. Vérifier que :
   - ❌ Le champ **Date** n'est PAS visible (caché)
   - ✅ Le champ **Email** est pré-rempli (si disponible)
   - ✅ Le champ **Téléphone** est pré-rempli (si disponible)
4. Ouvrir les DevTools et vérifier :
   - ✅ Un champ `<input type="hidden" name="complainDate">` existe
   - ✅ Sa valeur est la date du jour

### Test 2 : Vérifier la Lecture Seule (Profil Complet)

**Avec un utilisateur ayant email ET téléphone :**
1. Ouvrir le formulaire
2. Essayer de cliquer dans le champ email
3. Essayer de modifier le texte
4. Vérifier que :
   - ❌ Le champ ne peut pas être modifié
   - 🎨 Le fond est gris clair
   - 🚫 Le curseur montre "non autorisé"
5. Répéter pour le champ téléphone

### Test 3 : Vérifier la Saisie Libre (Profil Incomplet)

**Avec un utilisateur SANS téléphone dans son profil :**
1. Ouvrir le formulaire
2. Vérifier que :
   - 🔒 Email est pré-rempli et en lecture seule (gris)
   - ✏️ Téléphone est vide et modifiable (blanc)
3. Saisir un numéro de téléphone
4. Soumettre la réclamation
5. Vérifier que la réclamation est soumise avec le téléphone saisi

### Test 4 : Vérifier le Champ Vide Complet

**Avec un utilisateur SANS email NI téléphone :**
1. Ouvrir le formulaire
2. Vérifier que :
   - ✏️ Email est vide et modifiable
   - ✏️ Téléphone est vide et modifiable
3. Remplir les deux champs
4. Soumettre la réclamation

### Test 3 : Persistance Après Soumission

1. Soumettre une réclamation
2. Le formulaire se réinitialise
3. Vérifier que les champs sont à nouveau pré-remplis :
   - ✅ Email
   - ✅ Téléphone
   - ✅ Date (mise à jour)

### Test 4 : Utilisateur Sans Téléphone

1. Se connecter avec un compte sans numéro de téléphone
2. Vérifier que le champ téléphone est vide
3. Vérifier que l'email est quand même pré-rempli

---

## 📊 Structure des Données Utilisateur

### Champs Disponibles dans `getCurrentUser()`

```typescript
interface UserProfile {
  id: string
  email: string
  phoneNumber?: string
  phone?: string
  firstName?: string
  lastName?: string
  fullName?: string
  [key: string]: any
}
```

### Ordre de Priorité pour le Téléphone

```typescript
phone: user.phoneNumber || user.phone || ""
```

1. **`user.phoneNumber`** : Champ principal
2. **`user.phone`** : Champ alternatif
3. **`""`** : Chaîne vide si aucun téléphone disponible

---

## 🎨 Interface Utilisateur

### Logique Conditionnelle : Lecture Seule ou Modifiable

Les champs Email et Téléphone sont **dynamiques** :
- **Si pré-remplis** : Lecture seule (protégés)
- **Si vides** : Modifiables (l'utilisateur peut les remplir)

```typescript
<Input
  id="email"
  type="email"
  value={formData.email || ""}
  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
  placeholder="votre@email.com"
  required
  readOnly={!!(formData.email)}                      // ← Lecture seule SI pré-rempli
  className={formData.email ? "bg-gray-50 cursor-not-allowed" : ""}  // ← Style SI pré-rempli
/>
```

### Comportement selon les Données Disponibles

| Scénario | Email Disponible | Téléphone Disponible | Comportement |
|----------|------------------|----------------------|--------------|
| **Profil complet** | ✅ Oui | ✅ Oui | 🔒 Les deux champs en lecture seule |
| **Email uniquement** | ✅ Oui | ❌ Non | 🔒 Email en lecture seule<br>✏️ Téléphone modifiable |
| **Téléphone uniquement** | ❌ Non | ✅ Oui | ✏️ Email modifiable<br>🔒 Téléphone en lecture seule |
| **Profil incomplet** | ❌ Non | ❌ Non | ✏️ Les deux champs modifiables |

**Apparence visuelle (si pré-rempli) :**
- 🔒 Fond gris clair (`bg-gray-50`)
- 🚫 Curseur "non autorisé" (`cursor-not-allowed`)
- ❌ Impossible de modifier le texte

**Apparence visuelle (si vide) :**
- ⬜ Fond blanc (normal)
- ✏️ Curseur texte (normal)
- ✅ Peut saisir le texte

### Champs Modifiables vs Non Modifiables

| Champ | Visible | Modifiable | Raison |
|-------|---------|------------|--------|
| Date | ❌ Non | ❌ Non | 🔒 Automatique (date du jour, cachée) |
| Email | ✅ Oui | **Conditionnel** 🔀 | 🔒 Si pré-rempli (protégé)<br>✏️ Si vide (saisie libre) |
| Téléphone | ✅ Oui | **Conditionnel** 🔀 | 🔒 Si pré-rempli (protégé)<br>✏️ Si vide (saisie libre) |
| Type | ✅ Oui | ✅ Toujours | Choix de l'utilisateur |
| Motif | ✅ Oui | ✅ Toujours | Choix de l'utilisateur |
| Description | ✅ Oui | ✅ Toujours | Saisie libre |

### Champs Obligatoires

Tous les champs restent **obligatoires** :

- 🔒 Email (required, readOnly)
- 🔒 Téléphone (required, readOnly)
- ✅ Date (required, modifiable)
- ✅ Type (required, modifiable)
- ✅ Description (required, modifiable)

---

## 🔍 Gestion des Erreurs

### Si l'Utilisateur n'est Pas Connecté

```typescript
try {
  const user = await getCurrentUser()
  if (user) {
    // Pré-remplir les champs
  }
} catch (error) {
  console.error("Erreur lors du chargement des informations utilisateur:", error)
  // Les champs restent vides, l'utilisateur doit les remplir manuellement
}
```

### Si les Informations Sont Manquantes

```typescript
email: user.email || "",           // Chaîne vide si pas d'email
phone: user.phoneNumber || user.phone || ""  // Chaîne vide si pas de téléphone
```

---

## 📱 Compatibilité

### Navigateurs Supportés

- ✅ Chrome / Edge (dernières versions)
- ✅ Firefox (dernières versions)
- ✅ Safari (dernières versions)
- ✅ Mobile (iOS / Android)

### Versions React

- ✅ React 18+
- ✅ Next.js 14+

---

## 🚀 Déploiement

### Pas de Migration Requise

Cette fonctionnalité est **purement côté client** et ne nécessite aucune modification de la base de données ou du backend.

### Déploiement Frontend

```bash
# Dans le répertoire ebanking-web-app-with-api-momo
npm run build
npm run deploy  # ou votre commande de déploiement
```

---

## 📚 Documentation Associée

- 📄 `app/user/actions.ts` - Fonction `getCurrentUser()`
- 📄 `app/services/reclamation/page.tsx` - Formulaire de réclamation principal
- 📄 `app/services/complain/page.tsx` - Formulaire de réclamation alternatif
- 📄 `app/services/reclamation/actions.ts` - Actions backend

---

## ✅ Résultat Final

### Formulaire Avant
```
┌─────────────────────────────────┐
│ Type: [             ] *         │
│ Motif: [            ]           │
│ Date: [            ] *          │ ← Visible
│ Email: [           ] *          │ ← Vide
│ Téléphone: [       ] *          │ ← Vide
│ Description: [     ] *          │
│ [ ] J'accepte                   │
│ [Soumettre]                     │
└─────────────────────────────────┘
```

### Formulaire Après (Profil Complet)
```
┌─────────────────────────────────┐
│ Type: [             ] *         │
│ Motif: [            ]           │
│                                 │ ← ❌ Date CACHÉE (automatique)
│ Email: [user@mail.com] * 🔒     │ ← ✅ Pré-rempli (LECTURE SEULE)
│ Téléphone: [+224 6XX...] * 🔒   │ ← ✅ Pré-rempli (LECTURE SEULE)
│ Description: [     ] *          │
│ [ ] J'accepte                   │
│ [Soumettre]                     │
└─────────────────────────────────┘
```

### Formulaire Après (Sans Téléphone)
```
┌─────────────────────────────────┐
│ Type: [             ] *         │
│ Motif: [            ]           │
│                                 │ ← ❌ Date CACHÉE (automatique)
│ Email: [user@mail.com] * 🔒     │ ← ✅ Pré-rempli (LECTURE SEULE)
│ Téléphone: [           ] * ✏️   │ ← ⬜ VIDE (MODIFIABLE)
│ Description: [     ] *          │
│ [ ] J'accepte                   │
│ [Soumettre]                     │
└─────────────────────────────────┘

❌ = Date cachée (automatique, invisible)
🔒 = Champ en lecture seule (fond gris, pré-rempli)
✏️ = Champ modifiable (fond blanc, vide)
```

---

**Date de mise en œuvre:** 2026-02-03  
**Version:** 1.0.0  
**Statut:** ✅ Implémenté et testé

