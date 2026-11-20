/** A press target inside the card: an action area, or an overlay. */
export const action = "> [data-card-action]";
export const overlay = "[data-card-overlay]";
/** Either target, in a state, for use inside `:has()`. */
export const target = (state: string) =>
  `${action}${state}, ${overlay}${state}`;
