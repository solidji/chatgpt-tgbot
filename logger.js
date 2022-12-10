export function logger(...messages) {
  if (process.env.NODE_ENV === 'production') return
  for (const message of messages) {
    console.log(message)
  }
}
