import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <div>
                <p className="font-bold text-gray-900">Astra eBanking</p>
                <p className="text-xs text-gray-500">BNG</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Votre partenaire bancaire de confiance en Côte d'Ivoire</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Services</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/accounts/balance" className="hover:text-blue-600">
                  Comptes
                </Link>
              </li>
              <li>
                <Link href="/cartes" className="hover:text-blue-600">
                  Cartes
                </Link>
              </li>
              <li>
                <Link href="/transfers/new" className="hover:text-blue-600">
                  Virements
                </Link>
              </li>
              <li>
                <Link href="/investments" className="hover:text-blue-600">
                  Investissements
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Support</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/support/chat" className="hover:text-blue-600">
                  Chat en direct
                </Link>
              </li>
              <li>
                <Link href="/support/help" className="hover:text-blue-600">
                  Centre d'aide
                </Link>
              </li>
              <li>
                <Link href="/complaints" className="hover:text-blue-600">
                  Réclamations
                </Link>
              </li>
              <li>
                <Link href="/agences" className="hover:text-blue-600">
                  Nos agences
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>+225 20 20 20 20</li>
              <li>contact@bng.ci</li>
              <li>Plateau, Abidjan</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-600">© 2024 BNG - Banque Nationale de Gestion. Tous droits réservés.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="#" className="text-sm text-gray-600 hover:text-blue-600">
              Conditions d'utilisation
            </Link>
            <Link href="#" className="text-sm text-gray-600 hover:text-blue-600">
              Politique de confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}