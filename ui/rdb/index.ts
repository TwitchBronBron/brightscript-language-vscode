import RegistryView from './views/RegistryView.svelte';
import CommandsView from './views/CommandsView.svelte';

declare const viewName; // Provided by ViewProviders
let view;

switch(viewName) {
	case 'RegistryView':
		view = RegistryView;
		break;
	case 'CommandsView':
		view = CommandsView;
		break;
}
const app = new view({
	target: document.body
});
export {app};
