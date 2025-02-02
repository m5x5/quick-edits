import fs from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { compile } from '.'
import plugin from './plugin'
import { compileCss, optimizeCss } from './test-utils/run'

const css = String.raw

describe('--alpha(…)', () => {
  test('--alpha(…)', async () => {
    expect(
      await compileCss(css`
        .foo {
          margin: --alpha(red / 50%);
        }
      `),
    ).toMatchInlineSnapshot(`
      ".foo {
        margin: oklab(62.7955% .22486 .12584 / .5);
      }"
    `)
  })

  test('--alpha(…) errors when no arguments are used', async () => {
    expect(() =>
      compileCss(css`
        .foo {
          margin: --alpha();
        }
      `),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: The --alpha(…) function requires a color and an alpha value, e.g.: \`--alpha(var(--my-color) / 50%)\`]`,
    )
  })

  test('--alpha(…) errors when alpha value is missing', async () => {
    expect(() =>
      compileCss(css`
        .foo {
          margin: --alpha(red);
        }
      `),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: The --alpha(…) function requires a color and an alpha value, e.g.: \`--alpha(red / 50%)\`]`,
    )
  })

  test('--alpha(…) errors multiple arguments are used', async () => {
    expect(() =>
      compileCss(css`
        .foo {
          margin: --alpha(red / 50%, blue);
        }
      `),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: The --alpha(…) function only accepts one argument, e.g.: \`--alpha(red / 50%)\`]`,
    )
  })
})

describe('--spacing(…)', () => {
  test('--spacing(…)', async () => {
    expect(
      await compileCss(css`
        @theme {
          --spacing: 0.25rem;
        }

        .foo {
          margin: --spacing(4);
        }
      `),
    ).toMatchInlineSnapshot(`
      ":root {
        --spacing: .25rem;
      }

      .foo {
        margin: calc(var(--spacing) * 4);
      }"
    `)
  })

  test('--spacing(…) with inline `@theme` value', async () => {
    expect(
      await compileCss(css`
        @theme inline {
          --spacing: 0.25rem;
        }

        .foo {
          margin: --spacing(4);
        }
      `),
    ).toMatchInlineSnapshot(`
      ":root {
        --spacing: .25rem;
      }

      .foo {
        margin: 1rem;
      }"
    `)
  })

  test('--spacing(…) relies on `--spacing` to be defined', async () => {
    expect(() =>
      compileCss(css`
        .foo {
          margin: --spacing(4);
        }
      `),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: The --spacing(…) function requires that the \`--spacing\` theme variable exists, but it was not found.]`,
    )
  })

  test('--spacing(…) requires a single value', async () => {
    expect(() =>
      compileCss(css`
        @theme {
          --spacing: 0.25rem;
        }

        .foo {
          margin: --spacing();
        }
      `),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: The --spacing(…) function requires an argument, but received none.]`,
    )
  })

  test('--spacing(…) does not have multiple arguments', async () => {
    expect(() =>
      compileCss(css`
        .foo {
          margin: --spacing(4, 5, 6);
        }
      `),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: The --spacing(…) function only accepts a single argument, but received 3.]`,
    )
  })
})

describe('--theme(…)', () => {
  test('--theme(--color-red-500)', async () => {
    expect(
      await compileCss(css`
        @theme {
          --color-red-500: #f00;
        }
        .red {
          color: --theme(--color-red-500);
        }
      `),
    ).toMatchInlineSnapshot(`
      ":root {
        --color-red-500: red;
      }

      .red {
        color: red;
      }"
    `)
  })

  test('--theme(…) can only be used with CSS variables from your theme', async () => {
    expect(() =>
      compileCss(css`
        @theme {
          --color-red-500: #f00;
        }
        .red {
          color: --theme(colors.red.500);
        }
      `),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: The --theme(…) function can only be used with CSS variables from your theme.]`,
    )
  })
})

describe('theme(…)', () => {
  describe('in declaration values', () => {
    describe('without fallback values', () => {
      test('theme(colors.red.500)', async () => {
        expect(
          await compileCss(css`
            @theme {
              --color-red-500: #f00;
            }
            .red {
              color: theme(colors.red.500);
            }
          `),
        ).toMatchInlineSnapshot(`
          ":root {
            --color-red-500: red;
          }

          .red {
            color: red;
          }"
        `)
      })

      test("theme('colors.red.500')", async () => {
        expect(
          await compileCss(css`
            @theme {
              --color-red-500: #f00;
            }
            .red {
              color: theme('colors.red.500');
            }
          `),
        ).toMatchInlineSnapshot(`
          ":root {
            --color-red-500: red;
          }

          .red {
            color: red;
          }"
        `)
      })

      test('theme(colors[red]500)', async () => {
        expect(
          await compileCss(css`
            @theme {
              --color-red-500: #f00;
            }
            .red {
              color: theme(colors[red]500);
            }
          `),
        ).toMatchInlineSnapshot(`
          ":root {
            --color-red-500: red;
          }

          .red {
            color: red;
          }"
        `)
      })

      test('theme(colors[red].500)', async () => {
        expect(
          await compileCss(css`
            @theme {
              --color-red-500: #f00;
            }
            .red {
              color: theme(colors[red].500);
            }
          `),
        ).toMatchInlineSnapshot(`
          ":root {
            --color-red-500: red;
          }

          .red {
            color: red;
          }"
        `)
      })

      test('theme(colors[red][500])', async () => {
        expect(
          await compileCss(css`
            @theme {
              --color-red-500: #f00;
            }
            .red {
              color: theme(colors[red][500]);
            }
          `),
        ).toMatchInlineSnapshot(`
          ":root {
            --color-red-500: red;
          }

          .red {
            color: red;
          }"
        `)
      })

      test('theme(colors[red].[500])', async () => {
        expect(
          await compileCss(css`
            @theme {
              --color-red-500: #f00;
            }
            .red {
              color: theme(colors[red].[500]);
            }
          `),
        ).toMatchInlineSnapshot(`
          ":root {
            --color-red-500: red;
          }

          .red {
            color: red;
          }"
        `)
      })

      test('theme(colors.red.500/75%)', async () => {
        expect(
          await compileCss(css`
            @theme {
              --color-red-500: #f00;
            }
            .red {
              color: theme(colors.red.500/75%);
            }
          `),
        ).toMatchInlineSnapshot(`
          ":root {
            --color-red-500: red;
          }

          .red {
            color: oklab(62.7955% .22486 .12584 / .75);
          }"
        `)
      })

      test('theme(colors.red.500 / 75%)', async () => {
        expect(
          await compileCss(css`
            @theme {
              --color-red-500: #f00;
            }
            .red {
              color: theme(colors.red.500 / 75%);
            }
          `),
        ).toMatchInlineSnapshot(`
          ":root {
            --color-red-500: red;
          }

          .red {
            color: oklab(62.7955% .22486 .12584 / .75);
          }"
        `)
      })

      test("theme('colors.red.500 / 75%')", async () => {
        expect(
          await compileCss(css`
            @theme {
              --color-red-500: #f00;
            }
            .red {
              color: theme('colors.red.500 / 75%');
            }
          `),
        ).toMatchInlineSnapshot(`
          ":root {
            --color-red-500: red;
          }

          .red {
            color: oklab(62.7955% .22486 .12584 / .75);
          }"
        `)
      })

      test('theme(colors.red.500/var(--opacity))', async () => {
        expect(
          await compileCss(css`
            @theme {
              --color-red-500: #f00;
            }
            .red {
              color: theme(colors.red.500/var(--opacity));
            }
          `),
        ).toMatchInlineSnapshot(`
          ":root {
            --color-red-500: red;
          }

          .red {
            color: color-mix(in oklab, red var(--opacity), transparent);
          }"
        `)
      })

      test('theme(colors.red.500/var(--opacity,50%))', async () => {
        expect(
          await compileCss(css`
            @theme {
              --color-red-500: #f00;
            }
            .red {
              /* prettier-ignore */
              color: theme(colors.red.500/var(--opacity,50%));
            }
          `),
        ).toMatchInlineSnapshot(`
          ":root {
            --color-red-500: red;
          }

          .red {
            color: color-mix(in oklab, red var(--opacity, 50%), transparent);
          }"
        `)
      })

      test('theme(spacing.12)', async () => {
        expect(
          await compileCss(css`
            @theme {
              --spacing-12: 3rem;
            }
            .space-on-the-left {
              margin-left: theme(spacing.12);
            }
          `),
        ).toMatchInlineSnapshot(`
          ":root {
            --spacing-12: 3rem;
          }

          .space-on-the-left {
            margin-left: 3rem;
          }"
        `)
      })

      test('theme(spacing[2.5])', async () => {
        expect(
          await compileCss(css`
            @theme {
              --spacing-2_5: 0.625rem;
            }
            .space-on-the-left {
              margin-left: theme(spacing[2.5]);
            }
          `),
        ).toMatchInlineSnapshot(`
          ":root {
            --spacing-2_5: .625rem;
          }

          .space-on-the-left {
            margin-left: .625rem;
          }"
        `)
      })

      test('calc(100vh - theme(spacing[2.5]))', async () => {
        expect(
          await compileCss(css`
            @theme {
              --spacing-2_5: 0.625rem;
            }
            .space-on-the-left {
              margin-left: calc(100vh - theme(spacing[2.5]));
            }
          `),
        ).toMatchInlineSnapshot(`
          ":root {
            --spacing-2_5: .625rem;
          }

          .space-on-the-left {
            margin-left: calc(100vh - .625rem);
          }"
        `)
      })

      test('theme(borderRadius.lg)', async () => {
        expect(
          await compileCss(css`
            @theme {
              --radius-lg: 0.5rem;
            }
            .radius {
              border-radius: theme(borderRadius.lg);
            }
          `),
        ).toMatchInlineSnapshot(`
          ":root {
            --radius-lg: .5rem;
          }

          .radius {
            border-radius: .5rem;
          }"
        `)
      })

      describe('for v3 compatibility', () => {
        test('theme(blur.DEFAULT)', async () => {
          expect(
            await compileCss(css`
              @theme {
                --blur: 8px;
              }
              .default-blur {
                filter: blur(theme(blur.DEFAULT));
              }
            `),
          ).toMatchInlineSnapshot(`
          ":root {
            --blur: 8px;
          }

          .default-blur {
            filter: blur(8px);
          }"
        `)
        })

        test('theme(fontSize.xs[1].lineHeight)', async () => {
          expect(
            await compileCss(css`
              @theme {
                --text-xs: 1337.75rem;
                --text-xs--line-height: 1337rem;
              }
              .text {
                font-size: theme(fontSize.xs);
                line-height: theme(fontSize.xs[1].lineHeight);
              }
            `),
          ).toMatchInlineSnapshot(`
            ":root {
              --text-xs: 1337.75rem;
              --text-xs--line-height: 1337rem;
            }

            .text {
              font-size: 1337.75rem;
              line-height: 1337rem;
            }"
          `)
        })

        test('theme(fontFamily.sans) (css)', async () => {
          expect(
            await compileCss(css`
              @theme default reference {
                --font-family-sans: ui-sans-serif, system-ui, sans-serif, Apple Color Emoji,
                  Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;
              }
              .fam {
                font-family: theme(fontFamily.sans);
              }
            `),
          ).toMatchInlineSnapshot(`
          ".fam {
            font-family: ui-sans-serif, system-ui, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;
          }"
        `)
        })

        test('theme(fontFamily.sans) (config)', async () => {
          let compiled = await compile(
            css`
              @config "./my-config.js";
              .fam {
                font-family: theme(fontFamily.sans);
              }
            `,
            {
              loadModule: async () => ({ module: {}, base: '/root' }),
            },
          )

          expect(optimizeCss(compiled.build([])).trim()).toMatchInlineSnapshot(`
          ".fam {
            font-family: ui-sans-serif, system-ui, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;
          }"
        `)
        })
      })

      test('theme(colors.unknown.500)', async () =>
        expect(() =>
          compileCss(css`
            .red {
              color: theme(colors.unknown.500);
            }
          `),
        ).rejects.toThrowErrorMatchingInlineSnapshot(
          `[Error: Could not resolve value for theme function: \`theme(colors.unknown.500)\`. Consider checking if the path is correct or provide a fallback value to silence this error.]`,
        ))
    })

    describe('with default values', () => {
      test('theme(colors.red.unknown / 50%, #f00)', async () => {
        expect(
          await compileCss(css`
            .red {
              color: theme(colors.red.unknown / 50%, #f00);
            }
          `),
        ).toMatchInlineSnapshot(`
          ".red {
            color: red;
          }"
        `)
      })

      test('theme(colors.red.unknown / 75%, theme(colors.red.500 / 25%))', async () => {
        expect(
          await compileCss(css`
            @theme {
              --color-red-500: #f00;
            }
            .red {
              color: theme(colors.red.unknown / 75%, theme(colors.red.500 / 25%));
            }
          `),
        ).toMatchInlineSnapshot(`
          ":root {
            --color-red-500: red;
          }

          .red {
            color: oklab(62.7955% .22486 .12584 / .25);
          }"
        `)
      })

      test('theme(fontFamily.unknown, Helvetica Neue, Helvetica, sans-serif)', async () => {
        expect(
          await compileCss(css`
            .fam {
              font-family: theme(fontFamily.unknown, Helvetica Neue, Helvetica, sans-serif);
            }
          `),
        ).toMatchInlineSnapshot(`
          ".fam {
            font-family: Helvetica Neue, Helvetica, sans-serif;
          }"
        `)
      })

      test('theme(\n\tfontFamily.unknown,\n\tHelvetica Neue,\n\tHelvetica,\n\tsans-serif\n)', async () => {
        expect(
          // prettier-ignore
          await compileCss(css`
            .fam {
              font-family: theme(
                fontFamily.unknown,
                Helvetica Neue,
                Helvetica,
                sans-serif
              );
            }
          `),
        ).toMatchInlineSnapshot(`
          ".fam {
            font-family: Helvetica Neue, Helvetica, sans-serif;
          }"
        `)
      })
    })

    describe('recursive theme()', () => {
      test('can references theme inside @theme', async () => {
        expect(
          await compileCss(css`
            @theme {
              --color-red-500: #f00;
              --color-foo: theme(colors.red.500);
            }
            .red {
              color: theme(colors.foo);
            }
          `),
        ).toMatchInlineSnapshot(`
          ":root {
            --color-red-500: red;
            --color-foo: red;
          }

          .red {
            color: red;
          }"
        `)
      })

      test('can references theme inside @theme and stacking opacity', async () => {
        expect(
          await compileCss(css`
            @theme {
              --color-red-500: #f00;
              --color-foo: theme(colors.red.500 / 50%);
            }
            .red {
              color: theme(colors.foo / 50%);
            }
          `),
        ).toMatchInlineSnapshot(`
          ":root {
            --color-red-500: red;
            --color-foo: oklab(62.7955% .22486 .12584 / .5);
          }

          .red {
            color: oklab(62.7955% .22486 .12584 / .25);
          }"
        `)
      })
    })

    describe('with CSS variable syntax', () => {
      test('theme(--color-red-500)', async () => {
        expect(
          await compileCss(css`
            @theme {
              --color-red-500: #f00;
            }
            .red {
              color: theme(--color-red-500);
            }
          `),
        ).toMatchInlineSnapshot(`
          ":root {
            --color-red-500: red;
          }

          .red {
            color: red;
          }"
        `)
      })

      test('theme(--color-red-500 / 50%)', async () => {
        expect(
          await compileCss(css`
            @theme {
              --color-red-500: #f00;
            }
            .red {
              color: theme(--color-red-500 / 50%);
            }
          `),
        ).toMatchInlineSnapshot(`
          ":root {
            --color-red-500: red;
          }

          .red {
            color: oklab(62.7955% .22486 .12584 / .5);
          }"
        `)
      })

      test('theme("--color-red-500")', async () => {
        expect(
          await compileCss(css`
            @theme {
              --color-red-500: #f00;
            }
            .red {
              color: theme(--color-red-500);
            }
          `),
        ).toMatchInlineSnapshot(`
          ":root {
            --color-red-500: red;
          }

          .red {
            color: red;
          }"
        `)
      })
    })

    describe('resolving --default lookups', () => {
      test('theme(blur.DEFAULT)', async () => {
        expect(
          await compileCss(css`
            @theme {
              --blur: 8px;
            }
            .blur {
              filter: blur(theme(blur));
            }
          `),
        ).toMatchInlineSnapshot(`
          ":root {
            --blur: 8px;
          }

          .blur {
            filter: blur(8px);
          }"
        `)
      })
    })

    describe('with default theme', () => {
      test.each([
        [
          'fontFamily.sans',
          'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
        ],
        ['maxWidth.xs', '20rem'],
        ['transitionTimingFunction.in-out', 'cubic-bezier(.4, 0, .2, 1)'],
        ['letterSpacing.wide', '.025em'],
        ['lineHeight.tight', '1.25'],
        ['backgroundColor.red.500', 'oklch(.637 .237 25.331)'],
      ])('theme(%s) → %s', async (value, result) => {
        let defaultTheme = await fs.readFile(path.join(__dirname, '..', 'theme.css'), 'utf8')
        let compiled = await compileCss(css`
          ${defaultTheme}
          .custom {
            --custom-value: theme(${value});
          }
        `)

        let startOfCustomClass = compiled.indexOf('.custom {\n')
        let endOfCustomClass = compiled.indexOf('}', startOfCustomClass)

        let customClassRule = compiled
          .slice(startOfCustomClass + '.custom {\n'.length, endOfCustomClass)
          .replace('--custom-value:', '')
          .trim()
          .slice(0, -1)

        expect(customClassRule).toBe(result)
      })
    })
  })

  describe('in candidates', () => {
    test('sm:[--color:theme(colors.red[500])]', async () => {
      expect(
        await compileCss(
          css`
            @tailwind utilities;
            @theme {
              --breakpoint-sm: 40rem;
              --color-red-500: #f00;
            }
          `,
          ['sm:[--color:theme(colors.red[500])]'],
        ),
      ).toMatchInlineSnapshot(`
        "@media (width >= 40rem) {
          .sm\\:\\[--color\\:theme\\(colors\\.red\\[500\\]\\)\\] {
            --color: red;
          }
        }

        :root {
          --breakpoint-sm: 40rem;
          --color-red-500: red;
        }"
      `)
    })

    test("values that don't exist don't produce candidates", async () => {
      // This guarantees that valid candidates still make it through when some are invalid
      expect(
        await compileCss(
          css`
            @tailwind utilities;
            @theme reference {
              --radius-sm: 2rem;
            }
          `,
          [
            'rounded-[theme(--radius-sm)]',
            'rounded-[theme(i.do.not.exist)]',
            'rounded-[theme(--i-do-not-exist)]',
          ],
        ),
      ).toMatchInlineSnapshot(`
        ".rounded-\\[theme\\(--radius-sm\\)\\] {
          border-radius: 2rem;
        }"
      `)

      // This guarantees no output for the following candidates
      expect(
        await compileCss(
          css`
            @tailwind utilities;
            @theme reference {
              --radius-sm: 2rem;
            }
          `,
          ['rounded-[theme(i.do.not.exist)]', 'rounded-[theme(--i-do-not-exist)]'],
        ),
      ).toEqual('')
    })
  })

  describe('in @media queries', () => {
    test('@media (min-width:theme(breakpoint.md)) and (max-width: theme(--breakpoint-lg))', async () => {
      expect(
        await compileCss(css`
          @theme {
            --breakpoint-md: 48rem;
            --breakpoint-lg: 64rem;
          }
          /* prettier-ignore */
          @media (min-width:theme(breakpoint.md)) and (max-width: theme(--breakpoint-lg)) {
            .red {
              color: red;
            }
          }
        `),
      ).toMatchInlineSnapshot(`
        ":root {
          --breakpoint-md: 48rem;
          --breakpoint-lg: 64rem;
        }

        @media (width >= 48rem) and (width <= 64rem) {
          .red {
            color: red;
          }
        }"
      `)
    })

    test('@media (width >= theme(breakpoint.md)) and (width<theme(--breakpoint-lg))', async () => {
      expect(
        await compileCss(css`
          @theme {
            --breakpoint-md: 48rem;
            --breakpoint-lg: 64rem;
          }
          @media (width >= theme(breakpoint.md)) and (width<theme(--breakpoint-lg)) {
            .red {
              color: red;
            }
          }
        `),
      ).toMatchInlineSnapshot(`
        ":root {
          --breakpoint-md: 48rem;
          --breakpoint-lg: 64rem;
        }

        @media (width >= 48rem) and (width < 64rem) {
          .red {
            color: red;
          }
        }"
      `)
    })
  })

  test('@custom-media --my-media (min-width: theme(breakpoint.md))', async () => {
    expect(
      await compileCss(css`
        @theme {
          --breakpoint-md: 48rem;
        }
        @custom-media --my-media (min-width: theme(breakpoint.md));
        @media (--my-media) {
          .red {
            color: red;
          }
        }
      `),
    ).toMatchInlineSnapshot(`
      ":root {
        --breakpoint-md: 48rem;
      }

      @media (width >= 48rem) {
        .red {
          color: red;
        }
      }"
    `)
  })

  test('@container (width > theme(breakpoint.md))', async () => {
    expect(
      await compileCss(css`
        @theme {
          --breakpoint-md: 48rem;
        }
        @container (width > theme(breakpoint.md)) {
          .red {
            color: red;
          }
        }
      `),
    ).toMatchInlineSnapshot(`
      ":root {
        --breakpoint-md: 48rem;
      }

      @container (width > 48rem) {
        .red {
          color: red;
        }
      }"
    `)
  })

  test('@supports (text-stroke: theme(--font-size-xs))', async () => {
    expect(
      await compileCss(css`
        @theme {
          --font-size-xs: 0.75rem;
        }
        @supports (text-stroke: theme(--font-size-xs)) {
          .red {
            color: red;
          }
        }
      `),
    ).toMatchInlineSnapshot(`
      ":root {
        --font-size-xs: .75rem;
      }

      @supports (text-stroke: 0.75rem) {
        .red {
          color: red;
        }
      }"
    `)
  })
})

describe('in plugins', () => {
  test('CSS theme functions in plugins are properly evaluated', async () => {
    let compiled = await compile(
      css`
        @layer base, utilities;
        @plugin "my-plugin";
        @theme reference {
          --color-red: oklch(62% 0.25 30);
          --color-orange: oklch(79% 0.17 70);
          --color-blue: oklch(45% 0.31 264);
          --color-pink: oklch(87% 0.07 7);
        }
        @layer utilities {
          @tailwind utilities;
        }
      `,
      {
        async loadModule() {
          return {
            module: plugin(({ addBase, addUtilities }) => {
              addBase({
                '.my-base-rule': {
                  color: 'theme(colors.red)',
                  'outline-color': 'theme(colors.orange / 15%)',
                  'background-color': 'theme(--color-blue)',
                  'border-color': 'theme(--color-pink / 10%)',
                },
              })

              addUtilities({
                '.my-utility': {
                  color: 'theme(colors.red)',
                },
              })
            }),
            base: '/root',
          }
        },
      },
    )

    expect(optimizeCss(compiled.build(['my-utility'])).trim()).toMatchInlineSnapshot(`
      "@layer base {
        .my-base-rule {
          color: oklch(62% .25 30);
          background-color: oklch(45% .31 264);
          border-color: oklab(87% .06947 .00853 / .1);
          outline-color: oklab(79% .05814 .15974 / .15);
        }
      }

      @layer utilities {
        .my-utility {
          color: oklch(62% .25 30);
        }
      }"
    `)
  })
})

describe('in JS config files', () => {
  test('CSS theme functions in config files are properly evaluated', async () => {
    let compiled = await compile(
      css`
        @layer base, utilities;
        @config "./my-config.js";
        @theme reference {
          --color-red: red;
          --color-orange: orange;
        }
        @layer utilities {
          @tailwind utilities;
        }
      `,
      {
        loadModule: async () => ({
          module: {
            theme: {
              extend: {
                colors: {
                  primary: 'theme(colors.red)',
                  secondary: 'theme(--color-orange)',
                },
              },
            },
            plugins: [
              plugin(({ addBase, addUtilities }) => {
                addBase({
                  '.my-base-rule': {
                    background: 'theme(colors.primary)',
                    color: 'theme(colors.secondary)',
                  },
                })

                addUtilities({
                  '.my-utility': {
                    color: 'theme(colors.red)',
                  },
                })
              }),
            ],
          },
          base: '/root',
        }),
      },
    )

    expect(optimizeCss(compiled.build(['my-utility'])).trim()).toMatchInlineSnapshot(`
      "@layer base {
        .my-base-rule {
          color: orange;
          background: red;
        }
      }

      @layer utilities {
        .my-utility {
          color: red;
        }
      }"
    `)
  })
})

test('replaces CSS theme() function with values inside imported stylesheets', async () => {
  expect(
    await compileCss(
      css`
        @theme {
          --color-red-500: #f00;
        }
        @import './bar.css';
      `,
      [],
      {
        async loadStylesheet() {
          return {
            base: '/bar.css',
            content: css`
              .red {
                color: theme(colors.red.500);
              }
            `,
          }
        },
      },
    ),
  ).toMatchInlineSnapshot(`
    ":root {
      --color-red-500: red;
    }

    .red {
      color: red;
    }"
  `)
})

test('resolves paths ending with a 1', async () => {
  expect(
    await compileCss(
      css`
        @theme {
          --spacing-1: 0.25rem;
        }

        .foo {
          margin: theme(spacing.1);
        }
      `,
      [],
    ),
  ).toMatchInlineSnapshot(`
    ":root {
      --spacing-1: .25rem;
    }

    .foo {
      margin: .25rem;
    }"
  `)
})

test('upgrades to a full JS compat theme lookup if a value can not be mapped to a CSS variable', async () => {
  expect(
    await compileCss(
      css`
        .semi {
          font-weight: theme(fontWeight.semibold);
        }
      `,
      [],
    ),
  ).toMatchInlineSnapshot(`
    ".semi {
      font-weight: 600;
    }"
  `)
})
