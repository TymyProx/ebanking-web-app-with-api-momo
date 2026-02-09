/**
 * Transaction Classification Utility
 * 
 * This utility provides reliable DEBIT/CREDIT classification for transactions
 * relative to the account being displayed.
 * 
 * IMPORTANT: Transaction amounts are always POSITIVE in the database.
 * The sign (debit/credit) must be determined by the account relationship.
 * 
 * Rules:
 * 1. If displayed account = numCompte (debit account) → DEBIT (money going out)
 * 2. If displayed account = creditAccount (credit account) → CREDIT (money coming in)
 * 3. Fallback to txnType field if accounts cannot be matched
 */

export interface TransactionClassification {
  type: 'DEBIT' | 'CREDIT'
  direction: 'in' | 'out'
  confidence: 'high' | 'medium' | 'low'
  reason: string
}

/**
 * Classify transaction as DEBIT or CREDIT relative to an account
 * 
 * @param transaction - Transaction object
 * @param accountNumber - Account number being displayed (numCompte or accountNumber)
 * @returns Classification result
 */
export function classifyTransaction(
  transaction: any,
  accountNumber: string
): TransactionClassification {
  if (!transaction) {
    return {
      type: 'DEBIT',
      direction: 'out',
      confidence: 'low',
      reason: 'No transaction provided',
    }
  }

  if (!accountNumber) {
    return {
      type: (transaction.txnType?.toUpperCase() || 'DEBIT') as 'DEBIT' | 'CREDIT',
      direction: transaction.txnType?.toUpperCase() === 'CREDIT' ? 'in' : 'out',
      confidence: 'low',
      reason: 'No account number provided',
    }
  }

  // Normalize account number for comparison
  const normalizedAccountNumber = String(accountNumber).trim()
  
  // Get transaction accounts
  const transactionDebitAccount = String(transaction.numCompte || '').trim()
  const transactionCreditAccount = String(transaction.creditAccount || '').trim()
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 [TransactionClassifier] Classifying transaction:`)
    console.log(`   Account being displayed: ${normalizedAccountNumber}`)
    console.log(`   Transaction debit (numCompte): ${transactionDebitAccount}`)
    console.log(`   Transaction credit (creditAccount): ${transactionCreditAccount}`)
    console.log(`   Transaction txnType: ${transaction.txnType}`)
  }

  // Rule 1: Check if displayed account is the CREDIT account (money coming IN)
  if (transactionCreditAccount && transactionCreditAccount === normalizedAccountNumber) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`   ✅ Classification: CREDIT (account receives money)`)
    }
    return {
      type: 'CREDIT',
      direction: 'in',
      confidence: 'high',
      reason: 'Account matches creditAccount field',
    }
  }

  // Rule 2: Check if displayed account is the DEBIT account (money going OUT)
  if (transactionDebitAccount && transactionDebitAccount === normalizedAccountNumber) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`   ✅ Classification: DEBIT (account sends money)`)
    }
    return {
      type: 'DEBIT',
      direction: 'out',
      confidence: 'high',
      reason: 'Account matches numCompte (debit) field',
    }
  }

  // Rule 3: Fallback to txnType field if available
  if (transaction.txnType) {
    const txnTypeUpper = String(transaction.txnType).toUpperCase()
    const isCredit = txnTypeUpper === 'CREDIT'
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`   ⚠️ Fallback to txnType: ${txnTypeUpper}`)
    }
    
    return {
      type: txnTypeUpper as 'DEBIT' | 'CREDIT',
      direction: isCredit ? 'in' : 'out',
      confidence: 'medium',
      reason: 'Based on txnType field (accounts did not match)',
    }
  }

  // Rule 4: Final fallback - assume DEBIT if no other information
  if (process.env.NODE_ENV === 'development') {
    console.log(`   ⚠️ No classification possible, defaulting to DEBIT`)
  }
  
  return {
    type: 'DEBIT',
    direction: 'out',
    confidence: 'low',
    reason: 'No matching accounts or txnType - defaulted to DEBIT',
  }
}

/**
 * Get signed amount for a transaction relative to an account
 * Negative for DEBIT (money out), Positive for CREDIT (money in)
 * 
 * @param transaction - Transaction object
 * @param accountNumber - Account number being displayed
 * @returns Signed amount (negative for debit, positive for credit)
 */
export function getSignedAmount(transaction: any, accountNumber: string): number {
  const amount = Math.abs(
    Number.parseFloat(transaction.montantOperation) || 
    Number.parseFloat(transaction.amount) || 
    0
  )

  const classification = classifyTransaction(transaction, accountNumber)
  
  // DEBIT = negative (money out)
  // CREDIT = positive (money in)
  return classification.type === 'CREDIT' ? amount : -amount
}

/**
 * Format amount with sign for display
 * 
 * @param transaction - Transaction object
 * @param accountNumber - Account number being displayed
 * @param currency - Currency code (default: 'GNF')
 * @returns Formatted amount with sign (e.g., "+ 100 000 GNF" or "- 50 000 GNF")
 */
export function formatAmountWithSign(
  transaction: any,
  accountNumber: string,
  currency: string = 'GNF'
): string {
  const amount = Math.abs(
    Number.parseFloat(transaction.montantOperation) || 
    Number.parseFloat(transaction.amount) || 
    0
  )

  const classification = classifyTransaction(transaction, accountNumber)
  const sign = classification.type === 'CREDIT' ? '+' : '-'
  
  // Format with French locale (space as thousands separator)
  const formattedAmount = amount.toLocaleString('fr-FR', { 
    maximumFractionDigits: 0 
  })

  return `${sign} ${formattedAmount} ${currency}`
}

/**
 * Batch classify transactions for an account
 * Adds classification info to each transaction
 * 
 * @param transactions - Array of transactions
 * @param accountNumber - Account number being displayed
 * @returns Transactions with classification added
 */
export function classifyTransactions(transactions: any[], accountNumber: string): any[] {
  if (!Array.isArray(transactions)) {
    return []
  }

  return transactions.map(transaction => {
    const classification = classifyTransaction(transaction, accountNumber)
    
    return {
      ...transaction,
      // Add classification fields
      classifiedType: classification.type,
      classifiedDirection: classification.direction,
      classificationConfidence: classification.confidence,
      classificationReason: classification.reason,
      // Add signed amount
      signedAmount: getSignedAmount(transaction, accountNumber),
    }
  })
}




