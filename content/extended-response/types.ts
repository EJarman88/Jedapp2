export interface ExtendedResponsePassage {
  label: string;
  text: string;
}

/**
 * A GED RLA-format extended response prompt — two passages taking opposing
 * positions, and a task asking the writer to argue which position is better
 * supported. Original content only, per CLAUDE.md — never real GED items.
 */
export interface ExtendedResponsePrompt {
  id: string;
  title: string;
  instructions: string;
  passages: ExtendedResponsePassage[];
  suggestedMinutes: number;
}
