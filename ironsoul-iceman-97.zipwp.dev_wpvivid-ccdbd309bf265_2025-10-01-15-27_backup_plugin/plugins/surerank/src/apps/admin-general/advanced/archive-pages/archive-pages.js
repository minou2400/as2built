import PageContentWrapper from '@AdminComponents/page-content-wrapper';
import { __ } from '@wordpress/i18n';
import withSuspense from '@AdminComponents/hoc/with-suspense';
import GeneratePageContent from '@Functions/page-content-generator';
import { createLazyRoute } from '@tanstack/react-router';

export const PAGE_CONTENT = [
	{
		container: {
			direction: 'column',
			gap: 6,
		},
		content: [
			{
				id: 'author_archive',
				type: 'switch',
				storeKey: 'author_archive',
				label: __( 'Enable Author Archive', 'surerank' ),
				description: __(
					'Enabling this creates author archive pages that list all posts by each author, helping showcase contributions and strengthen SEO signals. If disabled, author archive pages redirect to the homepage.',
					'surerank'
				),
			},
			{
				id: 'date_archive',
				type: 'switch',
				storeKey: 'date_archive',
				label: __( 'Enable Date Archive', 'surerank' ),
				description: __(
					'Enabling this creates date archive pages that group posts by month or year, making it easier for visitors to browse content chronologically and for search engines to index time-based posts. If disabled, date archive pages redirect to the homepage.',
					'surerank'
				),
			},
		],
	},
];

const ArchivePages = () => {
	return (
		<PageContentWrapper
			title={ __( 'Archive Pages', 'surerank' ) }
			description={ __(
				'Archive Pages let visitors access links to view posts by author or by date. This makes it easier for people to find content based on who wrote it or when it was published.',
				'surerank'
			) }
		>
			<GeneratePageContent json={ PAGE_CONTENT } />
		</PageContentWrapper>
	);
};

export const LazyRoute = createLazyRoute( '/archive_pages' )( {
	component: withSuspense( ArchivePages ),
} );

export default withSuspense( ArchivePages );
