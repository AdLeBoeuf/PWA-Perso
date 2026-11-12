export const dateLabel = (value) =>
  new Date(value?.seconds ? value.seconds * 1000 : value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

export const errorLabel = (error) =>
  error?.code?.replace('auth/', '').replaceAll('-', ' ') || 'Une erreur est survenue.'
