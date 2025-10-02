const pluginRedirection = () => {
	try {
		const navLinks = getPluginNavigationLink();

		if ( navLinks.length > 0 ) {
			window.location.href = navLinks[ 0 ];
		} else {
			const redirectionType = zipwp_redirection.redirection_type;
			switch ( redirectionType ) {
				case 'plugin':
					window.location.href = zipwp_redirection.plugins_page;
					break;
				case 'theme':
					window.location.href = zipwp_redirection.themes_page;
					break;
			}
		}
	} catch ( error ) {
		console.error( error );
	}
};

const getPluginNavigationLink = () => {
	const currItems = Array.from(
		document.querySelectorAll( '#adminmenu [href]' )
	).map( ( item ) => item.getAttribute( 'href' ) );

	const defaultWPLinks = [
		'index.php',
		'update-core.php',
		'edit.php',
		'post-new.php',
		'edit-tags.php?taxonomy=category',
		'edit-tags.php?taxonomy=post_tag',
		'upload.php',
		'media-new.php',
		'edit.php?post_type=page',
		'post-new.php?post_type=page',
		'edit-comments.php',
		'themes.php',
		'customize.php?return=%2Fwp-admin%2Fplugins.php%3Fplugin_status%3Dall%26paged%3D1%26s',
		'widgets.php',
		'nav-menus.php',
		'customize.php?return=%2Fwp-admin%2Fplugins.php%3Fplugin_status%3Dall%26paged%3D1%26s&autofocus%5Bcontrol%5D=background_image',
		'themes.php?page=custom-background',
		'theme-editor.php',
		'plugins.php',
		'plugin-install.php',
		'plugin-editor.php',
		'users.php',
		'user-new.php',
		'profile.php',
		'tools.php',
		'import.php',
		'export.php',
		'site-health.php',
		'export-personal-data.php',
		'erase-personal-data.php',
		'options-general.php',
		'options-writing.php',
		'options-reading.php',
		'options-discussion.php',
		'options-media.php',
		'options-permalink.php',
		'options-privacy.php',
		'themes.php?page=custom-header',
		'site-editor.php',
		'site-editor.php?postType=wp_template&postId=twentytwentytwo%2F%2Fhome',
		'admin.php?page=spectra',
		'customize.php',
		'themes.php?page=move-to-host',
	];

	const diff = currItems.filter(
		( item ) =>
			! defaultWPLinks.includes( item ) &&
			! item.includes( 'customize.php?return=' )
	);

	return diff;
};

pluginRedirection();
