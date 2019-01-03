export function generateName() {
  const vowels = 'aeiouy'.split('')
  const consonents = 'bcdfghjklmnpqrstvwxz'.split('')
  const otherSounds = ['br', 'cr', 'dr', 'fr', 'gr', 'kr', 'pr', 'sr', 'tr', 'vr', 'st', 'ph', 'th']
  const toCombineWithVowels = [].concat(consonents).concat(otherSounds)
  const syllables = [].concat(vowels).concat(consonents)
  const nSyllablesInName = ceil(random() * 1) + 2

  let name = ''

  for (let consonent of toCombineWithVowels) {
    for (let vowel of vowels) {
      syllables.push(consonent + vowel)
    }
  }

  for (let i = nSyllablesInName - 1; i >= 0; i--) {
    name += (vowels.includes(name[name.length - 1]))
      ? syllables[floor(random() * syllables.length)]
      : vowels[floor(random() * vowels.length)]
  }

  return name[0].toUpperCase() + name.slice(1)
}
