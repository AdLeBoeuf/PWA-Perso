import { useMemo, useState } from 'react'
import { Check, ChevronDown, ChevronRight, Edit3, Filter, Folder, Plus, Trash2, X } from 'lucide-react'
import Button from '../common/Button'
import Page from '../common/Page'
import Empty from '../common/Empty'
import { MUSCLE_GROUPS } from '../../constants/muscles'
import { createUserData, deleteUserData, updateUserData } from '../../services/workoutService'

export function ExercisesTab({ uid, exercises, refresh, setNotice }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState(MUSCLE_GROUPS[0])
  const [folderChoice, setFolderChoice] = useState('')
  const [newFolderInput, setNewFolderInput] = useState('')
  const [editing, setEditing] = useState(null)
  // Accordéon exclusif : un seul dossier ouvert à la fois. Tous repliés par défaut au chargement.
  const [openFolder, setOpenFolder] = useState(null)
  // Filtre par groupe musculaire ("all" = Tous les muscles par défaut)
  const [selectedMuscle, setSelectedMuscle] = useState('all')

  function toggleFolder(folderKey) {
    setOpenFolder((prev) => (prev === folderKey ? null : folderKey))
  }

  // Liste dynamique des dossiers uniques créés par l'utilisateur
  const existingFolders = useMemo(() => {
    const set = new Set()
    exercises.forEach((ex) => {
      const f = (ex.folder || '').trim()
      if (f) set.add(f)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }))
  }, [exercises])

  // Exercices filtrés par groupe musculaire
  const filteredExercises = useMemo(() => {
    if (selectedMuscle === 'all') return exercises
    return exercises.filter((ex) => ex.category === selectedMuscle)
  }, [exercises, selectedMuscle])

  // Regroupement par dossier : les dossiers qui se retrouvent vides à cause du filtre
  // disparaissent automatiquement car ils n'ont aucune entrée dans `groups`
  const groupedExercises = useMemo(() => {
    const groups = {}
    const unclassified = []

    filteredExercises.forEach((ex) => {
      const f = (ex.folder || '').trim()
      if (f) {
        if (!groups[f]) groups[f] = []
        groups[f].push(ex)
      } else {
        unclassified.push(ex)
      }
    })

    const sortedFolders = Object.keys(groups).sort((a, b) =>
      a.localeCompare(b, 'fr', { sensitivity: 'base' })
    )

    return {
      folders: sortedFolders.map((folderName) => ({
        name: folderName,
        exercises: groups[folderName],
      })),
      unclassified,
    }
  }, [filteredExercises])

  function startEditing(exercise) {
    setEditing(exercise)
    setName(exercise.name || '')
    setCategory(exercise.category || MUSCLE_GROUPS[0])
    const folder = (exercise.folder || '').trim()
    if (folder) {
      setFolderChoice(folder)
      setNewFolderInput('')
      setOpenFolder(folder)
    } else {
      setFolderChoice('')
      setNewFolderInput('')
      setOpenFolder('__unclassified__')
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEditing() {
    setEditing(null)
    setName('')
    setCategory(MUSCLE_GROUPS[0])
    setFolderChoice('')
    setNewFolderInput('')
  }

  async function save(event) {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return

    let targetFolder = ''
    if (folderChoice === '__new__') {
      targetFolder = newFolderInput.trim()
    } else {
      targetFolder = folderChoice.trim()
    }

    const payload = {
      name: trimmedName,
      category: category || MUSCLE_GROUPS[0],
      folder: targetFolder,
    }

    try {
      if (editing) {
        await updateUserData('exercises', editing.id, payload)
      } else {
        await createUserData('exercises', uid, payload)
      }
      setOpenFolder(targetFolder || '__unclassified__')
      cancelEditing()
      await refresh()
    } catch {
      setNotice('Impossible d\u2019enregistrer cet exercice.')
    }
  }

  async function remove(id) {
    if (!window.confirm('Supprimer cet exercice ?')) return
    try {
      await deleteUserData('exercises', id)
      if (editing?.id === id) cancelEditing()
      await refresh()
    } catch {
      setNotice('Impossible de supprimer cet exercice.')
    }
  }

  function renderExerciseRow(exercise) {
    return (
      <div className="card list-row" key={exercise.id}>
        <div className="flex flex-col items-start gap-1 min-w-0 flex-1">
          <span className="font-semibold text-zinc-100 text-sm truncate w-full">{exercise.name}</span>
          {exercise.category && (
            <span className="px-2 py-1 text-xs rounded-full bg-gray-800 text-gray-300">
              {exercise.category}
            </span>
          )}
        </div>
        <div className="row-actions">
          <button
            type="button"
            onClick={() => startEditing(exercise)}
            title="Modifier"
            aria-label="Modifier l'exercice"
          >
            <Edit3 size={17} />
          </button>
          <button
            type="button"
            onClick={() => remove(exercise.id)}
            title="Supprimer"
            aria-label="Supprimer l'exercice"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>
    )
  }

  const subtitle = selectedMuscle !== 'all'
    ? `${filteredExercises.length} sur ${exercises.length} mouvement${exercises.length > 1 ? 's' : ''}`
    : `${exercises.length} mouvement${exercises.length > 1 ? 's' : ''}`

  return (
    <Page title="Exercices" subtitle={subtitle}>
      {/* 4. Le Filtre Hybride (tout en haut de la page) */}
      <div className="card p-3 mb-5">
        <label htmlFor="muscle-filter" className="text-xs font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
          <Filter size={14} className="text-zinc-400" />
          Filtrer par Groupe Musculaire
        </label>
        <select
          id="muscle-filter"
          value={selectedMuscle}
          onChange={(e) => setSelectedMuscle(e.target.value)}
        >
          <option value="all">Tous les muscles</option>
          {MUSCLE_GROUPS.map((group) => (
            <option key={group} value={group}>{group}</option>
          ))}
        </select>
      </div>

      {/* Formulaire d'ajout / modification */}
      <form className="card p-4 mb-6 grid gap-3" onSubmit={save}>
        <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
          <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
            {editing ? 'Modifier l’exercice' : 'Nouvel exercice'}
          </span>
          {editing && (
            <button
              type="button"
              onClick={cancelEditing}
              className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
            >
              <X size={14} /> Annuler
            </button>
          )}
        </div>

        <div className="grid gap-1">
          <label className="text-xs font-bold text-zinc-300">Nom de l'exercice</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex: Développé couché"
            required
            autoFocus={Boolean(editing)}
          />
        </div>

        {/* 3. Les Catégories Musculaires (Champ select obligatoire) */}
        <div className="grid gap-1">
          <label className="text-xs font-bold text-zinc-300">Groupe Musculaire</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            {MUSCLE_GROUPS.map((group) => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>

        {/* 2. Dossier personnalisé (existant ou nouveau) */}
        <div className="grid gap-1">
          <label className="text-xs font-bold text-zinc-300">Dossier</label>
          <select
            value={folderChoice}
            onChange={(e) => setFolderChoice(e.target.value)}
          >
            <option value="">Aucun dossier (Non classé)</option>
            {existingFolders.length > 0 && (
              <optgroup label="Dossiers existants">
                {existingFolders.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </optgroup>
            )}
            <option value="__new__">+ Nouveau dossier...</option>
          </select>
        </div>

        {folderChoice === '__new__' && (
          <div className="grid gap-1">
            <label className="text-xs font-bold text-zinc-300">Nom du nouveau dossier</label>
            <input
              value={newFolderInput}
              onChange={(e) => setNewFolderInput(e.target.value)}
              placeholder="ex: Pectoraux, Séances lourdes, Isos..."
              required
              autoFocus
            />
          </div>
        )}

        <Button type="submit" className="mt-1">
          {editing ? <Check size={18} /> : <Plus size={18} />}
          {editing ? 'Enregistrer les modifications' : 'Ajouter l’exercice'}
        </Button>
      </form>

      {/* 2. Le système de Dossiers (Accordéon exclusif avec chevron) */}
      {groupedExercises.folders.map((folder) => {
        const isOpen = openFolder === folder.name
        return (
          <section key={folder.name} className="mb-3">
            <button
              type="button"
              onClick={() => toggleFolder(folder.name)}
              className="w-full card flex items-center justify-between p-3.5 hover:border-zinc-500 transition-colors cursor-pointer text-left"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Folder size={18} className={isOpen ? 'text-zinc-200' : 'text-zinc-400'} />
                <h2 className="font-bold text-sm tracking-wide text-zinc-100 uppercase truncate m-0">
                  {folder.name}
                </h2>
                <span className="text-xs font-semibold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800 flex-shrink-0">
                  {folder.exercises.length}
                </span>
              </div>
              <div className="flex-shrink-0 text-zinc-400 ml-2">
                {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </div>
            </button>

            {isOpen && (
              <div className="list mt-2.5">
                {folder.exercises.map((exercise) => renderExerciseRow(exercise))}
              </div>
            )}
          </section>
        )
      })}

      {/* Section Non classés en accordéon exclusif */}
      {groupedExercises.unclassified.length > 0 && (() => {
        const isOpen = openFolder === '__unclassified__'
        return (
          <section className="mb-3">
            <button
              type="button"
              onClick={() => toggleFolder('__unclassified__')}
              className="w-full card flex items-center justify-between p-3.5 hover:border-zinc-500 transition-colors cursor-pointer text-left"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Folder size={18} className="text-zinc-500" />
                <h2 className="font-bold text-sm tracking-wide text-zinc-400 uppercase truncate m-0">
                  Non classés
                </h2>
                <span className="text-xs font-semibold text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800 flex-shrink-0">
                  {groupedExercises.unclassified.length}
                </span>
              </div>
              <div className="flex-shrink-0 text-zinc-500 ml-2">
                {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </div>
            </button>

            {isOpen && (
              <div className="list mt-2.5">
                {groupedExercises.unclassified.map((exercise) => renderExerciseRow(exercise))}
              </div>
            )}
          </section>
        )
      })()}

      {!exercises.length && (
        <Empty text="Ajoute ton premier mouvement pour commencer." />
      )}
      {exercises.length > 0 && !filteredExercises.length && (
        <Empty text="Aucun exercice trouvé pour ce groupe musculaire." />
      )}
    </Page>
  )
}

export default ExercisesTab
