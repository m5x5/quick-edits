const ZERO = 48
const NINE = 57

/**
 * Compare two strings alphanumerically, where numbers are compared as numbers
 * instead of strings.
 */
export function compare(a: string, z: string) {
  let aLen = a.length
  let zLen = z.length
  let minLen = aLen < zLen ? aLen : zLen

  for (let i = 0; i < minLen; i++) {
    let aCode = a.charCodeAt(i)
    let zCode = z.charCodeAt(i)

    // Continue if the characters are the same
    if (aCode === zCode) continue

    // If both are numbers, compare them as numbers instead of strings.
    if (aCode >= ZERO && aCode <= NINE && zCode >= ZERO && zCode <= NINE) {
      let aStart = i
      let aEnd = i + 1
      let zStart = i
      let zEnd = i + 1

      // Consume the number
      aCode = a.charCodeAt(aEnd)
      while (aCode >= ZERO && aCode <= NINE) aCode = a.charCodeAt(++aEnd)

      // Consume the number
      zCode = z.charCodeAt(zEnd)
      while (zCode >= ZERO && zCode <= NINE) zCode = z.charCodeAt(++zEnd)

      let aNumber = a.slice(aStart, aEnd)
      let zNumber = z.slice(zStart, zEnd)

      return (
        Number(aNumber) - Number(zNumber) ||
        // Fallback case if numbers are the same but the string representation
        // is not. Fallback to string sorting. E.g.: `0123` vs `123`
        (aNumber < zNumber ? -1 : 1)
      )
    }

    // Otherwise, compare them as strings
    return aCode - zCode
  }

  // If we got this far, the strings are equal up to the length of the shortest
  // string. The shortest string should come first.

  return a.length - z.length
}
