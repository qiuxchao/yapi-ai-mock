module.exports = {
  hooks: {
    'before:release': ['pnpm eslint:fix', 'pnpm build'],
    'after:release': "echo 'Release completed ✅'",
  },
  git: {
    commitMessage: '🐳chore: release v${version}',
  },
  github: {
    release: true,
  },
  plugins: {
    '@release-it/conventional-changelog': {
      header: '# Changelog',
      infile: 'CHANGELOG.md',
      preset: {
        name: 'conventionalcommits',
        types: [
          { type: 'feat', section: 'Features' },
          { type: 'fix', section: 'Bug Fixes' },
        ],
      },
    },
  },
};
