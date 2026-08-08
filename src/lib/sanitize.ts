/**
 * Search titles/snippets from the API contain exactly one kind of markup:
 * <mark> from Postgres ts_headline. Strip every other tag defensively before
 * the strings reach dangerouslySetInnerHTML.
 */
export function keepOnlyMarkTags(html: string): string {
  return html.replace(/<(?!\/?mark>)[^>]*>/g, '');
}
