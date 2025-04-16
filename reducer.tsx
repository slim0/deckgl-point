import * as arrow from "apache-arrow";
import { State } from "./App";

type Action =
  | { type: "dateChanged", result: number }
  | { type: "PlayButtonClicked", result: boolean }
  | { type: "filesParsed", result: string[] }
  | { type: "tableFetched", result: arrow.Table }
  | { type: "failure", error: string };

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "PlayButtonClicked":
      return { ...state, isPlaying: !state.isPlaying };
    case "filesParsed":
      return { ...state, filesS3Keys: action.result };
    case "dateChanged":
      const newIndex = action.result
      if (newIndex <= state.filesS3Keys.length) {
        return {
            ...state,
            currentIndex: newIndex,
          }
      } else {
        return {
            ...state,
            isPlaying: false,
          }
      }
    case "tableFetched":
      return { ...state, table: action.result };
    case "failure":
      return { ...state, error: action.error };
  }
}
