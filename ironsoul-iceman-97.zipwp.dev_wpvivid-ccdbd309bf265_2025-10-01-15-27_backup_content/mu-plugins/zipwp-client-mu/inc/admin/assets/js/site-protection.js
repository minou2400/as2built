( function ( $ ) {
	const validateText = function () {
		const processingText = $( '.zipwp-submit-btn' );
		const secretString = 'ok';
		const userInput = $( '#zipwp-input' );
		const errorText = $( '.zipwp-error-message' );
		const form = document.getElementById( 'zipwp-submit-form' );

		$( '#zipwp-input' ).on( 'input', function () {
			if ( userInput.val().toLowerCase() === secretString ) {
				errorText.css( 'visibility', 'hidden' );
				// errorText.hide();
				processingText.prop( 'disabled', false );
			} else if ( '' === userInput.val() ) {
				errorText.css( 'visibility', 'hidden' );
				// errorText.hide();
			} else {
				errorText.css( 'visibility', 'visible' );
				// errorText.show();
				processingText.prop( 'disabled', true );
			}
		} );

		form.addEventListener( 'submit', ( e ) => {
			e.preventDefault();
			if ( userInput.val().toLowerCase() === secretString ) {
				processingText.text( 'Verifying..' );

				const ajaxURL = $( '#zipwp-data' ).data( 'url' );
				const nonce = $(
					'input[name="zipwp_site_protection_nonce"]'
				).val();

				const data = {
					action: 'zipwp_site_protection_call',
					nonce,
				};

				$.ajax( {
					type: 'POST',
					url: ajaxURL,
					data,
					success() {
						console.log( 'Site verification successful.' );
						processingText.text( 'Redirecting..' );
						location.reload();
					},
					error() {
						console.log( 'Site verification failed.' );
					},
				} );
			}
		} );
	};

	validateText();
}( jQuery ) );
