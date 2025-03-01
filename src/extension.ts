/**
 * # Extension Entry Point
 *
 * The module `vscode` contains the VS Code extensibility API. The other
 * modules are part of the extension.
 */
import * as vscode from 'vscode'
import * as actions from './actions'
import * as commands from './commands'
/**
 * This method is called when the extension is activated. The activation events
 * are set in the `package.json` like this:
 * ```js
 * "activationEvents": [ "*" ],
 * ```
 * which means that the extension is activated as soon as VS Code is running.
 */
export function activate(context: vscode.ExtensionContext) {
	/**
	 * The commands are defined in the `package.json` file. We register them
	 * with function defined in the `commands` module.
	 */
	commands.register(context)
	/**
	 * We create an output channel for diagnostic messages and pass it to the
	 * `actions` module.
	 */
	let channel = vscode.window.createOutputChannel("ModalKeys")
	actions.setOutputChannel(channel)
	/**
	 * Then we subscribe to events we want to react to.
	 */
	context.subscriptions.push(
		channel,
		vscode.workspace.onDidChangeConfiguration(actions.updateFromConfig),
		vscode.window.onDidChangeVisibleTextEditors(commands.resetSelecting),
		vscode.window.onDidChangeActiveTextEditor(commands.restoreEditorMode),
		vscode.window.onDidChangeTextEditorSelection(e => {
			commands.onSelectionChanged(e)
			commands.updateCursorAndStatusBar(e.textEditor)
		}),
		vscode.workspace.onDidChangeTextDocument(commands.onTextChanged))
	/**
	 * Next we update the active settings from the config file, and at last,
	 * we enter into normal or edit mode depending on the settings.
	 */
	actions.updateFromConfig()
	if (actions.getStartInNormalMode())
        commands.enterMode('normal')
	else
        commands.enterMode('insert')
}
/**
 * This method is called when your extension is deactivated
 */
export function deactivate() {
    commands.enterMode('insert')
}