export type Language = 'pl' | 'en'

const originalTextNodes = new WeakMap<Text, string>()

const exactTranslations: Record<string, string> = {
  'Language:': 'Język:',
  'Game:': 'Gra:',
  'Draw Results': 'Wyniki losowań',
  'Frequency Analysis': 'Analiza częstotliwości',
  'Combinations': 'Kombinacje',
  'Check Numbers': 'Sprawdź liczby',
  'Predictions': 'Predykcje',
  'Refetching...': 'Ponowne pobieranie...',
  '🔄 Refetch': '🔄 Odśwież',
  'Most recent draws:': 'Najnowsze losowania:',
  'Draw range:': 'Zakres losowań:',
  'to': 'do',
  'Loading...': 'Ładowanie...',
  'Error:': 'Błąd:',
  'No Data:': 'Brak danych:',
  'Try Again': 'Spróbuj ponownie',
  'Retry Fetch': 'Ponów pobieranie',
  'Draw range': 'Zakres losowań',
  'Recent draws': 'Najnowsze losowania',
  'Official': 'Oficjalne',
  'Complete historical data from official Lotto.pl API': 'Pełne dane historyczne z oficjalnego API Lotto.pl',
  'Next Draw Prediction': 'Predykcja następnego losowania',
  'Following Draws': 'Kolejne losowania',
  'Improved Algorithm': 'Ulepszony algorytm',
  'Advanced Predictor': 'Zaawansowany predyktor',
  'Adaptive AI': 'Adaptacyjne AI',
  'Big Number Pattern': 'Wzorce dużych liczb',
  'Predictions ▲': 'Predykcje ▲',
  'Predictions ▼': 'Predykcje ▼'
}

const wordTranslations: Array<[RegExp, string]> = [
  [/\bResults\b/g, 'Wyniki'],
  [/\bResult\b/g, 'Wynik'],
  [/\bAnalysis\b/g, 'Analiza'],
  [/\bFrequency\b/g, 'Częstotliwość'],
  [/\bCombination\b/g, 'Kombinacja'],
  [/\bCombinations\b/g, 'Kombinacje'],
  [/\bCheck\b/g, 'Sprawdź'],
  [/\bNumbers\b/g, 'Liczby'],
  [/\bNumber\b/g, 'Liczba'],
  [/\bPrediction\b/g, 'Predykcja'],
  [/\bPredictions\b/g, 'Predykcje'],
  [/\bAlgorithm\b/g, 'Algorytm'],
  [/\bAdvanced\b/g, 'Zaawansowany'],
  [/\bAdaptive\b/g, 'Adaptacyjny'],
  [/\bFollowing\b/g, 'Kolejne'],
  [/\bDraws\b/g, 'Losowania'],
  [/\bDraw\b/g, 'Losowanie'],
  [/\bMost recent\b/g, 'Najnowsze'],
  [/\bRefetch\b/g, 'Odśwież'],
  [/\bLoading\b/g, 'Ładowanie'],
  [/\bError\b/g, 'Błąd'],
  [/\bGame\b/g, 'Gra'],
  [/\bOfficial\b/g, 'Oficjalne'],
  [/\bhistorical\b/g, 'historyczne'],
  [/\btotal\b/g, 'łącznie'],
  [/\bselected\b/g, 'wybrano'],
  [/\bRecommended\b/g, 'Rekomendowane'],
  [/\bbest\b/g, 'najlepsza'],
  [/\bperformance\b/g, 'wydajność'],
  [/\bComplete\b/g, 'Pełne']
]

const regexTranslations: Array<[RegExp, (...args: string[]) => string]> = [
  [/^\s*of\s+(\d+)\s+total\s*$/i, (total) => `z ${total} łącznie`],
  [/^\s*\((\d+)\s+draws\s+selected\)\s*$/i, (count) => `(${count} losowań wybrano)`],
  [/^\s*From draw # \(1 = newest\)\s*$/i, () => 'Od losowania # (1 = najnowsze)'],
  [/^\s*To draw # \(1 = newest\)\s*$/i, () => 'Do losowania # (1 = najnowsze)'],
  [/^\s*Unable to fetch data from Lotto\.pl API\. Please check your API key or network connection\.\s*$/i, () => 'Nie można pobrać danych z API Lotto.pl. Sprawdź klucz API lub połączenie sieciowe.'],
  [/^\s*Check the browser console \(F12\) for detailed error information\.\s*$/i, () => 'Sprawdź konsolę przeglądarki (F12), aby zobaczyć szczegóły błędu.'],
  [/^\s*This might indicate an issue with the API key or the API endpoint\.\s*$/i, () => 'To może wskazywać problem z kluczem API lub adresem endpointu API.'],
  [/^\s*✓ Showing (\d+) most recent draws from official Lotto\.pl API\s*$/i, (count) => `✓ Pokazano ${count} najnowszych losowań z oficjalnego API Lotto.pl`],
  [/^\s*💡 Recommended: draws 1-(\d+) for best algorithm performance\s*$/i, (to) => `💡 Rekomendowane: losowania 1-${to} dla najlepszej wydajności algorytmu`],
  [/^\s*Official (EuroJackpot|Lotto) data from Lotto\.pl API \(https:\/\/developers\.lotto\.pl\/\)\.\s*$/i, (game) => `Oficjalne dane ${game} z API Lotto.pl (https://developers.lotto.pl).`],
  [/^\s*Complete historical results since (\d+)\.\s*$/i, (year) => `Pełne wyniki historyczne od ${year}.`]
]

function translateToPolish(source: string): string {
  const leading = source.match(/^\s*/)?.[0] ?? ''
  const trailing = source.match(/\s*$/)?.[0] ?? ''
  const core = source.trim()

  if (!core) return source

  if (exactTranslations[core]) {
    return `${leading}${exactTranslations[core]}${trailing}`
  }

  for (const [pattern, replacer] of regexTranslations) {
    const match = core.match(pattern)
    if (match) {
      return `${leading}${replacer(...match.slice(1))}${trailing}`
    }
  }

  let translated = core
  for (const [pattern, replacement] of wordTranslations) {
    translated = translated.replace(pattern, replacement)
  }

  return `${leading}${translated}${trailing}`
}

function shouldSkipNode(node: Text): boolean {
  const parent = node.parentElement
  if (!parent) return true

  const tagName = parent.tagName.toLowerCase()
  return (
    tagName === 'script' ||
    tagName === 'style' ||
    tagName === 'textarea' ||
    tagName === 'input' ||
    tagName === 'code' ||
    tagName === 'pre'
  )
}

export function applyDomTranslations(root: Element, language: Language): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)

  let currentNode = walker.nextNode()
  while (currentNode) {
    const textNode = currentNode as Text

    if (!shouldSkipNode(textNode)) {
      if (!originalTextNodes.has(textNode)) {
        originalTextNodes.set(textNode, textNode.nodeValue ?? '')
      }

      const original = originalTextNodes.get(textNode) ?? ''
      const nextText = language === 'pl' ? translateToPolish(original) : original

      if ((textNode.nodeValue ?? '') !== nextText) {
        textNode.nodeValue = nextText
      }
    }

    currentNode = walker.nextNode()
  }
}
