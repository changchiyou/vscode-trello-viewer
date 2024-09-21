import * as vscode from "vscode";
import {
  TrelloUtils,
  removeTempTrelloFile,
  saveListener,
} from "./trello/TrelloUtils";
import { TrelloTreeView } from "./trello/TrelloTreeView";
import { TrelloViewFavoriteList } from "./trello/TrelloViewFavoriteList";
import { TrelloCard } from "./trello/trelloComponents";
import { TrelloItem } from "./trello/TrelloItem";

export function activate(context: vscode.ExtensionContext) {
  if (saveListener) {
    saveListener.dispose();
  }
  const trello = new TrelloUtils(context);
  const trelloTreeView = new TrelloTreeView(trello);
  const trelloViewFavoriteList = new TrelloViewFavoriteList(trello);
  // Tree views
  vscode.window.registerTreeDataProvider("trelloTreeView", trelloTreeView);
  vscode.window.registerTreeDataProvider(
    "trelloViewFavoriteList",
    trelloViewFavoriteList,
  );
  // Refresh
  vscode.commands.registerCommand("trelloViewer.refresh", () =>
    trelloTreeView.refresh(),
  );
  vscode.commands.registerCommand("trelloViewer.refreshFavoriteList", () =>
    trelloViewFavoriteList.refresh(),
  );
  // Tree View Actions - buttons
  vscode.commands.registerCommand("trelloViewer.authenticate", () =>
    trello.authenticate(),
  );
  vscode.commands.registerCommand("trelloViewer.resetCredentials", () =>
    trello.resetCredentials(),
  );
  vscode.commands.registerCommand("trelloViewer.showTrelloInfo", () =>
    trello.showTrelloInfo(),
  );
  vscode.commands.registerCommand("trelloViewer.resetFavoriteList", () =>
    trello.resetFavoriteList(),
  );
  // Alternative way to set credentials
  vscode.commands.registerCommand("trelloViewer.setCredentials", () =>
    trello.setCredentials(),
  );
  // List Actions - buttons
  vscode.commands.registerCommand(
    "trelloViewer.setFavoriteListByClick",
    (list: TrelloItem) => trello.setFavoriteListByClick(list),
  );
  vscode.commands.registerCommand("trelloViewer.addCard", (list: TrelloItem) =>
    trello.addCardToList(list),
  );
  // Card Actions - edit
  vscode.commands.registerCommand(
    "trelloViewer.editCardTitle",
    (card: TrelloItem) => trello.editTitle(card),
  );
  vscode.commands.registerCommand(
    "trelloViewer.editCardDescription",
    (card: TrelloItem) => trello.editDescription(card),
  );
  vscode.commands.registerCommand(
    "trelloViewer.addComment",
    (card: TrelloItem) => trello.addComment(card),
  );
  // Card Actions - user
  vscode.commands.registerCommand(
    "trelloViewer.addSelfToCard",
    (card: TrelloItem) => trello.addSelfToCard(card),
  );
  vscode.commands.registerCommand(
    "trelloViewer.removeSelfFromCard",
    (card: TrelloItem) => trello.removeSelfFromCard(card),
  );
  vscode.commands.registerCommand(
    "trelloViewer.addUserToCard",
    (card: TrelloItem) => trello.addUserToCard(card),
  );
  vscode.commands.registerCommand(
    "trelloViewer.removeUserFromCard",
    (card: TrelloItem) => trello.removeUserFromCard(card),
  );
  // Card Actions - card
  vscode.commands.registerCommand(
    "trelloViewer.moveCardToList",
    (card: TrelloItem) => trello.moveCardToList(card),
  );
  vscode.commands.registerCommand(
    "trelloViewer.archiveCard",
    (card: TrelloItem) => trello.archiveCard(card),
  );
  // Card - Show using markdown preview
  vscode.commands.registerCommand("trelloViewer.showCard", (card: TrelloCard) =>
    trello.showCard(card),
  );
  vscode.commands.registerCommand(
    "trelloViewer.uploadUrlFromClipboard",
    (card: TrelloItem) => trello.uploadUrlFromClipboard(card),
  );
  vscode.commands.registerCommand(
    "trelloViewer.testtest",
    () => vscode.window.showInformationMessage("testtest"),
  );

  const disposable = vscode.languages.registerCodeLensProvider("*", {
    async provideCodeLenses(document: vscode.TextDocument) {
      const codeLenses: vscode.CodeLens[] = [];
      const card = await trello.getCardFromDocument(document);
      const cardItem = {
        id: card.id,
        boardId: card.idBoard,
        listId: card.idList,
      };

      const actionsMap = {
        "## **`Card Info`** ": [
          {
            title: "Move Card to list",
            command: "trelloViewer.moveCardToList",
          },
          {
            title: "Archive Card",
            command: "trelloViewer.archiveCard",
          },
        ],
        "## **`Members`** ": [
          { title: "Add Self", command: "trelloViewer.addSelfToCard" },
          { title: "Remove Self", command: "trelloViewer.removeSelfFromCard" },
          { title: "Add User", command: "trelloViewer.addUserToCard" },
          { title: "Remove User", command: "trelloViewer.removeUserFromCard" },
        ],
        "## **`Comments`**": [
          { title: "Add Comment", command: "trelloViewer.addComment" },
        ],
        "## **`Attachments`** ": [{ title: "Upload URL from Clipboard", command: "trelloViewer.uploadUrlFromClipboard"}],
      };

      for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        for (const [key, actions] of Object.entries(actionsMap)) {
          if (line.text.includes(key)) {
            const range = new vscode.Range(i, 0, i, line.text.length);
            actions.forEach(({ title, command }) => {
              codeLenses.push(
                new vscode.CodeLens(range, {
                  title,
                  command,
                  arguments: [cardItem],
                }),
              );
            });
          }
        }
      }
      return codeLenses;
    },
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {
  if (saveListener) {
    saveListener.dispose();
  }
  removeTempTrelloFile();
}
