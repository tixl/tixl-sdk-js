// append spaces until the text is a multiple of 16 bytes long
export default function pad16Bytes(text: string) {
  if (!text) return text;

  const diff = text.length % 16;

  if (diff === 0) return text;

  const pad = 17 - diff;
  return text + Array(pad).join(' ');
}
