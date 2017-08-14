const profiles = {}

module.exports = {
  get: (key) => profiles[key],
  set: (key, profile) => {
    profiles[key] = profile
  }
}
