# 🏦 Mise à jour de la validation de clé RIB - Procédure BCRG

**Date** : 10 février 2026  
**Statut** : ✅ Implémenté  
**Version** : 1.0 BCRG

---

## 📋 Résumé des changements

La validation de la clé RIB a été mise à jour dans le **e-portal** pour suivre la **procédure officielle BCRG** (Banque Centrale de la République de Guinée).

### Fichiers modifiés

1. **E-Portal (Web)** :
   - `/app/transfers/beneficiaries/page.tsx` - Gestion des bénéficiaires
   - `/app/transfers/new/page.tsx` - Nouveau virement

2. **Application Mobile** :
   - `/src/utils/ribValidation.js` - Utilitaires de validation RIB

---

## 🎯 Procédure officielle CleRIBBCRG

### Algorithme

```
PROCÉDURE CleRIBBCRG (CodeBank, CodeAgence, LeCompte10)

Variables:
  CompteBCRG       : chaîne de caractères
  Reste, K, Indice : entiers
  TailleCompte     : entier

Étapes:
  1. CompteBCRG = Complète(CodeBank,3) + Complète(CodeAgence,3) + Droite(LeCompte10,10) + "00"
  
  2. Reste = 0
  
  3. TailleCompte = Taille(CompteBCRG)
  
  4. POUR Indice = 1 À TailleCompte
       Reste = modulo(Reste * 10 + Val(CompteBCRG[[Indice]]), 97)
     FIN
  
  5. K = 97 - Reste
  
  6. RENVOYER (NumériqueVersChaîne(K, "02d"))

FIN PROCÉDURE
```

---

## 💡 Explication détaillée

### Étape 1 : Construction de CompteBCRG

**Format** : `CodeBank(3) + CodeAgence(3) + Compte(10) + "00"`

- **CodeBank** : Code banque complété à 3 chiffres (ex: `022` pour BNG)
- **CodeAgence** : Code agence complété à 3 chiffres (ex: `001` pour Conakry)
- **LeCompte10** : Les 10 **derniers** chiffres du numéro de compte
- **"00"** : Ajout de deux zéros à la fin

**Exemple :**
```
CodeBank = "022"
CodeAgence = "001"
LeCompte10 = "1234567890"

CompteBCRG = "022" + "001" + "1234567890" + "00"
           = "02200112345678900"
           = 18 caractères
```

### Étape 2-4 : Calcul du modulo 97

Le reste est calculé caractère par caractère en utilisant l'algorithme du modulo 97 :

```
Reste = 0

Pour chaque chiffre dans "02200112345678900":
  Reste = (Reste * 10 + ValeurDuChiffre) modulo 97
```

### Étape 5-6 : Calcul de la clé

```
K = 97 - Reste
Clé RIB = K formaté sur 2 chiffres (ex: "45")
```

---

## 🔄 Différences avec l'ancienne méthode

### Ancienne méthode (avant 10/02/2026)

- Conversion des lettres en chiffres avec `replaceLettersWithDigits`
  - A=10, B=11, C=12, ..., Z=35
- Concaténation : `CodeBank + CodeAgence + Compte`
- Calcul modulo 97 puis K = 97 - Reste

### Nouvelle méthode (BCRG officielle)

- **Pas de conversion de lettres** (codes uniquement numériques)
- Complétion des codes à 3 chiffres avec padStart
- Utilisation des 10 **derniers** chiffres du compte
- Ajout de "00" à la fin avant calcul
- Format : `CodeBank(3) + CodeAgence(3) + Compte(10) + "00"`

---

## ✅ Validations ajoutées

La nouvelle implémentation inclut des validations renforcées :

1. **Code Banque** :
   - Exactement 3 caractères
   - Uniquement des chiffres (0-9)

2. **Code Agence** :
   - Exactement 3 caractères
   - Uniquement des chiffres (0-9)

3. **Numéro de Compte** :
   - Exactement 10 chiffres
   - Uniquement des chiffres (0-9)

4. **Clé RIB** :
   - Exactement 2 chiffres
   - Uniquement des chiffres (0-9)

---

## 📊 Exemples de validation

### Exemple 1 : Validation réussie

```javascript
Code Banque:    "022"
Code Agence:    "001"
Compte:         "1234567890"
Clé RIB saisie: "45"

CompteBCRG = "02200112345678900"
Modulo 97 = 52
Clé calculée = 97 - 52 = 45

✅ Validation réussie : 45 = 45
```

### Exemple 2 : Validation échouée

```javascript
Code Banque:    "022"
Code Agence:    "001"
Compte:         "1234567890"
Clé RIB saisie: "44"

CompteBCRG = "02200112345678900"
Modulo 97 = 52
Clé calculée = 97 - 52 = 45

❌ Validation échouée : 44 ≠ 45
Message d'erreur : "Clé RIB invalide. Clé attendue : 45, clé saisie : 44"
```

---

## 🔍 Logs de débogage

La nouvelle implémentation inclut des logs détaillés pour faciliter le débogage :

### En cas de succès :
```
[RIB] ✅ Validation réussie selon la procédure BCRG
[RIB]   - Code Banque: 022
[RIB]   - Code Agence: 001
[RIB]   - Numéro de compte: 1234567890
[RIB]   - Clé RIB: 45
```

### En cas d'erreur :
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

## 🚀 Impact utilisateur

### Ajout de bénéficiaire

Lors de l'ajout d'un nouveau bénéficiaire dans le e-portal :

1. L'utilisateur saisit les informations du bénéficiaire
2. La validation RIB est effectuée **avant** la soumission
3. Si la clé est incorrecte, un message d'erreur détaillé s'affiche
4. L'utilisateur peut corriger la clé RIB avant de soumettre

### Nouveau virement

Lors de la création d'un nouveau virement avec un bénéficiaire ponctuel :

1. Validation automatique de la clé RIB saisie
2. Message d'erreur clair avec la clé attendue
3. Empêche la soumission si la validation échoue

---

## 🧪 Tests recommandés

### Test 1 : Bénéficiaire BNG interne

```
Type: BNG-BNG
Code Banque: 022
Code Agence: 001
Compte: 1234567890
Clé RIB: Calculer avec la nouvelle procédure
```

### Test 2 : Bénéficiaire confrère

```
Type: BNG-CONFRERE
Code Banque: (Selon la banque sélectionnée)
Code Agence: 001
Compte: 1234567890
Clé RIB: Calculer avec la nouvelle procédure
```

### Test 3 : Validation avec clé incorrecte

```
Saisir intentionnellement une clé incorrecte
Vérifier que le message d'erreur affiche la clé attendue
```

---

## 📚 Références

- **Backend API** : `/backendebanking/src/services/helpers/ribValidator.ts`
- **Documentation BCRG** : `/backendebanking/RIB_KEY_BCRG_PROCEDURE.md`
- **Script SQL** : `/backendebanking/scripts/011_update_rib_key_bcrg_procedure.sql`

---

## ⚠️ Notes importantes

1. **Compatibilité** : Cette mise à jour est compatible avec le backend qui utilise déjà la procédure BCRG
2. **Rétrocompatibilité** : Les bénéficiaires existants ne sont pas affectés (clés déjà validées)
3. **Application mobile** : Mise à jour également appliquée pour maintenir la cohérence
4. **Codes banque** : Tous les codes doivent être numériques (pas de lettres)

---

## 👥 Contact

Pour toute question sur cette mise à jour, contacter l'équipe de développement.

