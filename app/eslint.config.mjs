// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(
  {
    files: ['**/*.ts', '**/*.vue'],
    rules: {
      // Type safety
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Vue best practices
      'vue/no-unused-refs': 'warn',
      'vue/no-unused-components': 'warn',
      'vue/define-macros-order': [
        'warn',
        { order: ['defineProps', 'defineEmits', 'defineSlots'] },
      ],
      'vue/block-order': ['warn', { order: ['script', 'template', 'style'] }],
    },
  },
);
