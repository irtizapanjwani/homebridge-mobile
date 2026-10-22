// HomeBridge brand tokens, taken from the client's "HomeBridge Member App 2A" design.

export const colors = {
  green: '#17452F', // primary brand green
  greenDark: '#0F3322',
  greenMid: '#1F5A3D',
  greenPhoto: '#2C5E45',
  gold: '#C9A227',
  goldText: '#6B5510',
  goldLight: '#F2D97A',
  cream: '#F7F0DA',
  creamBorder: '#E6D9A6',
  paper: '#FBF8EF', // app background
  white: '#FFFFFF',
  ink: '#1A1D1A', // main text
  inkSoft: '#3E4A43',
  muted: '#5E6862',
  mint: '#E8F0EA',
  mintText: '#CFE0D4',
  mintFaint: '#B9CDBF',
  line: '#E3DDCA',
  lineSoft: '#ECE6D3',
  inputBorder: '#CFC7AE',
  chipBorder: '#D8D1BA',
  segment: '#EFEADB',
} as const;

// Font family names registered in src/app/_layout.tsx.
// React Native picks the weight from the family, so use these instead of fontWeight.
export const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  serifSemibold: 'Lora_600SemiBold',
  serifBold: 'Lora_700Bold',
  serifItalic: 'Lora_500Medium_Italic',
} as const;

export const TAB_BAR_HEIGHT = 68;
