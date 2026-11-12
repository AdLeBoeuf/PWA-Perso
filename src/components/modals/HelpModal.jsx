import { X } from 'lucide-react'

export function HelpModal({ onClose }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="help-title">
      <div className="card modal help-modal">
        <button className="modal-close" onClick={onClose} aria-label="Fermer">
          <X />
        </button>
        <p className="eyebrow">GUIDE DE DÉMARRAGE</p>
        <h2 id="help-title">Comment fonctionne l'application ?</h2>
        <div className="help-steps">
          <section>
            <span>1</span>
            <div>
              <h3>Les Exercices</h3>
              <p>Allez d'abord dans l'onglet « Exercices » pour ajouter vos mouvements, par exemple Développé couché ou Curl haltères.</p>
            </div>
          </section>
          <section>
            <span>2</span>
            <div>
              <h3>Les Séances</h3>
              <p>Allez dans l'onglet « Séances » pour créer vos modèles, comme Push, Pull ou Legs, en y piochant les exercices créés à l'étape 1.</p>
            </div>
          </section>
          <section>
            <span>3</span>
            <div>
              <h3>L'entraînement</h3>
              <p>Lancez votre séance depuis l'onglet « Aujourd'hui ». Validez les exercices dans l'ordre que vous voulez selon les machines disponibles. Validez chaque série : vos poids et vos PR seront automatiquement sauvegardés pour la prochaine fois.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default HelpModal

