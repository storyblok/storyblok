const EMAIL_TEST = 'test@storyblok.com'
const PASSWORD_TEST = 'test'
const TOKEN_TEST = 'storyblok1234'

const FAKE_COMPONENTS = [
  {
    name: 'teaser',
    display_name: null,
    created_at: '2019-10-15T17:00:32.212Z',
    id: 0,
    schema: {
      headline: {
        type: 'text'
      }
    },
    image: null,
    preview_field: null,
    is_root: false,
    preview_tmpl: null,
    is_nestable: true,
    all_presets: [],
    preset_id: null,
    real_name: 'teaser',
    component_group_uuid: null
  },
  {
    name: 'feature',
    display_name: null,
    created_at: '2019-11-06T17:07:04.196Z',
    updated_at: '2019-11-06T18:12:29.136Z',
    id: 1,
    schema: {
      logo: {
        type: 'image'
      },
      name: {
        type: 'text'
      },
      description: {
        type: 'textarea'
      },
      link_text: {
        type: 'text'
      },
      link: {
        type: 'multilink'
      }
    },
    image: null,
    preview_field: null,
    is_root: false,
    preview_tmpl: null,
    is_nestable: true,
    all_presets: [],
    preset_id: null,
    real_name: 'feature',
    component_group_uuid: null
  }
]

module.exports = {
  EMAIL_TEST,
  PASSWORD_TEST,
  TOKEN_TEST,
  FAKE_COMPONENTS
}
