// Mapping check types to SaaS content generation keys
export const CONTENT_GENERATION_MAPPING = {
	page_title: 'page_title',
	page_description: 'page_description',
	title: 'home_page_title',
	meta_description: 'home_page_description',
	site_tag_line: 'site_tag_line',
	url_length: 'page_url_slug',
};
// List of item ids that require content generation to fix
export const REQUIRE_CONTENT_GENERATION = Object.keys(
	CONTENT_GENERATION_MAPPING
);
