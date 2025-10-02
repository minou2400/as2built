jQuery( document ).ready( function ( $ ) {
	$( document ).on(
		'click',
		'#wp-admin-bar-zipwp-admin-menu .ab-item',
		function ( e ) {
			e.preventDefault();

			const customEvent = new Event( 'zipwpAdminNotice' );
			document.dispatchEvent( customEvent );

			const data = {
				action: 'zipwp_client_hide_dashboard_notice',
				nonce: zipwp_client_notice.dashboard_notice_nonce,
			};

			$.ajax( {
				type: 'POST',
				url: ajaxurl,
				data,
				success() {},
			} );
		}
	);
} );
