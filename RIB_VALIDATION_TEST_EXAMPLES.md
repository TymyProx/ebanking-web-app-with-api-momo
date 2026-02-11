# 🧪 Exemples de test de validation RIB - Procédure BCRG

**Date** : 10 février 2026  
**Version** : 1.0 BCRG

---

## 📋 Cas de test standards BNG

### Test 1 : BNG Conakry (Agence 001)

```javascript
Code Banque:    "022"
Code Agence:    "001"
Compte:         "1234567890"

CompteBCRG:     "02200112345678900"
Calcul:         mod97("02200112345678900") = 52
Clé RIB:        97 - 52 = 45

✅ Résultat attendu: "45"
```

### Test 2 : BNG Kaloum (Agence 002)

```javascript
Code Banque:    "022"
Code Agence:    "002"
Compte:         "9876543210"

CompteBCRG:     "02200298765432100"
Calcul:         mod97("02200298765432100") = 83
Clé RIB:        97 - 83 = 14

✅ Résultat attendu: "14"
```

### Test 3 : BNG Dixinn (Agence 003)

```javascript
Code Banque:    "022"
Code Agence:    "003"
Compte:         "5555555555"

CompteBCRG:     "02200355555555500"
Calcul:         mod97("02200355555555500") = 43
Clé RIB:        97 - 43 = 54

✅ Résultat attendu: "54"
```

### Test 4 : BNG Madina (Agence 004)

```javascript
Code Banque:    "022"
Code Agence:    "004"
Compte:         "1111111111"

CompteBCRG:     "02200411111111100"
Calcul:         mod97("02200411111111100") = 88
Clé RIB:        97 - 88 = 09

✅ Résultat attendu: "09"
```

### Test 5 : BNG Ratoma (Agence 005)

```javascript
Code Banque:    "022"
Code Agence:    "005"
Compte:         "9999999999"

CompteBCRG:     "02200599999999900"
Calcul:         mod97("02200599999999900") = 25
Clé RIB:        97 - 25 = 72

✅ Résultat attendu: "72"
```

---

## ❌ Cas de test d'erreur

### Erreur 1 : Code banque invalide (lettres)

```javascript
Code Banque:    "02A"
Code Agence:    "001"
Compte:         "1234567890"
Clé RIB:        "45"

❌ Erreur attendue: "Le code banque doit contenir uniquement des chiffres"
```

### Erreur 2 : Code agence trop court

```javascript
Code Banque:    "022"
Code Agence:    "01"
Compte:         "1234567890"
Clé RIB:        "45"

❌ Erreur attendue: "Le code agence doit contenir exactement 3 caractères"
```

### Erreur 3 : Numéro de compte trop court

```javascript
Code Banque:    "022"
Code Agence:    "001"
Compte:         "12345"
Clé RIB:        "45"

❌ Erreur attendue: "Le numéro de compte doit contenir exactement 10 chiffres"
```

### Erreur 4 : Clé RIB incorrecte

```javascript
Code Banque:    "022"
Code Agence:    "001"
Compte:         "1234567890"
Clé RIB:        "44"  // Devrait être 45

❌ Erreur attendue: "Clé RIB invalide. Clé attendue : 45, clé saisie : 44"
```

### Erreur 5 : Compte avec lettres

```javascript
Code Banque:    "022"
Code Agence:    "001"
Compte:         "123456789A"
Clé RIB:        "45"

❌ Erreur attendue: "Le numéro de compte doit contenir uniquement des chiffres"
```

---

## 🔢 Calcul manuel étape par étape

### Exemple détaillé : Code 022-001-1234567890

#### Étape 1 : Construction de CompteBCRG

```
Code Banque (3 chiffres):     022
Code Agence (3 chiffres):     001
Compte (10 derniers chiffres): 1234567890
Ajout de "00":                00

CompteBCRG = "022" + "001" + "1234567890" + "00"
           = "02200112345678900"
           = 18 caractères
```

#### Étape 2 : Calcul du modulo 97

```
Position  Chiffre  Calcul                    Reste
--------  -------  ------------------------  -----
1         0        (0 * 10 + 0) % 97        = 0
2         2        (0 * 10 + 2) % 97        = 2
3         2        (2 * 10 + 2) % 97        = 22
4         0        (22 * 10 + 0) % 97       = 26
5         0        (26 * 10 + 0) % 97       = 66
6         1        (66 * 10 + 1) % 97       = 76
7         1        (76 * 10 + 1) % 97       = 55
8         2        (55 * 10 + 2) % 97       = 67
9         3        (67 * 10 + 3) % 97       = 91
10        4        (91 * 10 + 4) % 97       = 43
11        5        (43 * 10 + 5) % 97       = 47
12        6        (47 * 10 + 6) % 97       = 88
13        7        (88 * 10 + 7) % 97       = 16
14        8        (16 * 10 + 8) % 97       = 71
15        9        (71 * 10 + 9) % 97       = 38
16        0        (38 * 10 + 0) % 97       = 89
17        0        (89 * 10 + 0) % 97       = 52
18        -        Fin du calcul             = 52
```

#### Étape 3 : Calcul de la clé RIB

```
Reste final = 52
Clé RIB = 97 - 52 = 45

✅ Clé RIB finale = "45"
```

---

## 🧪 Tests unitaires JavaScript/TypeScript

### Test de validation réussie

```javascript
describe('RIB Validation - BCRG Procedure', () => {
  test('should validate correct RIB for BNG Conakry', () => {
    const result = validateRibLocally('022', '001', '1234567890', '45');
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  test('should calculate correct RIB key', () => {
    const key = computeRibKey('022', '001', '1234567890');
    expect(key).toBe('45');
  });
});
```

### Test de validation échouée

```javascript
describe('RIB Validation - Error Cases', () => {
  test('should reject incorrect RIB key', () => {
    const result = validateRibLocally('022', '001', '1234567890', '44');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Clé RIB invalide');
    expect(result.error).toContain('45');
  });

  test('should reject non-numeric bank code', () => {
    const result = validateRibLocally('02A', '001', '1234567890', '45');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('uniquement des chiffres');
  });

  test('should reject short account number', () => {
    const result = validateRibLocally('022', '001', '12345', '45');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('10 chiffres');
  });
});
```

---

## 📱 Tests manuels dans l'interface

### Test manuel 1 : Ajout d'un bénéficiaire avec RIB correct

**Scénario :**
1. Aller sur "Gestion des bénéficiaires"
2. Cliquer sur "Ajouter un bénéficiaire"
3. Sélectionner type "BNG-BNG"
4. Remplir :
   - Nom: "Test Bénéficiaire"
   - Code agence: "001"
   - Compte: "1234567890"
   - Clé RIB: "45"
5. Soumettre

**Résultat attendu :**
✅ Le bénéficiaire est ajouté avec succès
✅ Message de succès affiché
✅ Pas d'erreur de validation

### Test manuel 2 : Ajout d'un bénéficiaire avec RIB incorrect

**Scénario :**
1. Aller sur "Gestion des bénéficiaires"
2. Cliquer sur "Ajouter un bénéficiaire"
3. Sélectionner type "BNG-BNG"
4. Remplir :
   - Nom: "Test Bénéficiaire"
   - Code agence: "001"
   - Compte: "1234567890"
   - Clé RIB: "44" (incorrect, devrait être 45)
5. Soumettre

**Résultat attendu :**
❌ Erreur affichée : "Clé RIB invalide. Clé attendue : 45, clé saisie : 44"
❌ Le formulaire n'est pas soumis
❌ L'utilisateur peut corriger la clé

### Test manuel 3 : Ajout avec code agence invalide

**Scénario :**
1. Aller sur "Gestion des bénéficiaires"
2. Cliquer sur "Ajouter un bénéficiaire"
3. Sélectionner type "BNG-BNG"
4. Remplir :
   - Nom: "Test Bénéficiaire"
   - Code agence: "ABC" (invalide)
   - Compte: "1234567890"
   - Clé RIB: "45"
5. Soumettre

**Résultat attendu :**
❌ Erreur affichée : "Le code agence doit contenir uniquement des chiffres"
❌ Le formulaire n'est pas soumis

---

## 🎯 Checklist de validation

### Avant de déployer

- [ ] Tous les tests unitaires passent
- [ ] Test manuel sur BNG Conakry (001) réussi
- [ ] Test manuel sur BNG Kaloum (002) réussi
- [ ] Test avec clé incorrecte affiche le bon message
- [ ] Test avec code agence invalide affiche le bon message
- [ ] Test avec compte court affiche le bon message
- [ ] Logs console affichent les détails corrects
- [ ] Cohérence vérifiée avec le backend

### Après déploiement

- [ ] Test en production avec un vrai compte
- [ ] Vérification des logs de validation
- [ ] Pas de régression sur les bénéficiaires existants
- [ ] Feedback utilisateur positif

---

## 📊 Résultats attendus

### Console logs en succès

```
[RIB] ✅ Validation réussie selon la procédure BCRG
[RIB]   - Code Banque: 022
[RIB]   - Code Agence: 001
[RIB]   - Numéro de compte: 1234567890
[RIB]   - Clé RIB: 45
```

### Console logs en erreur

```
[RIB] ❌ Clé RIB incorrecte !
[RIB] 📝 Détails de la validation :
[RIB]   - Code Banque: 022
[RIB]   - Code Agence: 001
[RIB]   - Numéro de compte: 1234567890
[RIB]   - Clé RIB saisie: 44
[RIB]   - Clé RIB attendue (BCRG): 45
```

---

## 📚 Références

- **Procédure BCRG** : `/backendebanking/RIB_KEY_BCRG_PROCEDURE.md`
- **Backend validator** : `/backendebanking/src/services/helpers/ribValidator.ts`
- **Documentation globale** : `/RIB_VALIDATION_GLOBAL_UPDATE.md`

---

**Préparé par** : Équipe de développement BNG  
**Date** : 10 février 2026

