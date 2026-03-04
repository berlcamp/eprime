export function fullTextQuery(string: string): string {
  // const isStringAllNumbers = (str: string) => {
  //   return /^\d+$/.test(str)
  // }

  // if (isStringAllNumbers(string)) {
  //   return parseInt(string, 10)
  // }

  const searchSplit = string.split(' ')

  const keywordArray: any[] = []
  searchSplit.forEach((item) => {
    if (item !== '') keywordArray.push(`'${item}'`)
  })
  const searchQuery = keywordArray.join(' & ')

  return searchQuery
}

export function capitalizeWords(inputString: string) {
  return inputString
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function formatToPesos(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(amount)
}

export function generateReferenceCode() {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const charactersLength = characters.length
  let counter = 0
  while (counter < 8) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
    counter += 1
  }
  return result
}

export function generateRandomAlphaNumber(length: number) {
  let result = ''
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const charactersLength = characters.length
  let counter = 0
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
    counter += 1
  }
  return result
}

export const sanitizeFileName = (name: string) =>
  name.replace(/[^a-zA-Z0-9.\-_]/g, '_') // replace special characters

/** Converts a number to words (e.g., for peso amounts in formal documents). */
export function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];

  function convertHundreds(n: number): string {
    if (n === 0) return "";
    let result = "";
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    } else if (n >= 10) {
      result += teens[n - 10] + " ";
      return result.trim();
    }
    if (n > 0) result += ones[n];
    return result.trim();
  }

  let result = "";
  let n = Math.floor(num);
  if (n >= 1_000_000) {
    result += convertHundreds(Math.floor(n / 1_000_000)) + " Million ";
    n %= 1_000_000;
  }
  if (n >= 1_000) {
    result += convertHundreds(Math.floor(n / 1_000)) + " Thousand ";
    n %= 1_000;
  }
  if (n > 0) result += convertHundreds(n);
  result = result.trim();
  return result ? result + " Pesos" : "";
}
