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
      preset: 'angular',
      header: '# Changelog',
      infile: 'CHANGELOG.md',
    },
  },
};
