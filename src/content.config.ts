import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

import { PALCOS } from './data/palcos';

const eventos = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/eventos' }),
  schema: z
    .object({
      titulo: z.string().min(1),
      data_inicio: z.iso.datetime({ offset: true }),
      data_fim: z.iso.datetime({ offset: true }).optional(),
      artistas: z.array(z.object({ nome: z.string(), destaque: z.boolean().default(false) })).default([]),
      palcos: z.array(z.enum(PALCOS)).default([]),
      imagem: z.object({ src: z.string(), alt: z.string(), foco: z.string().default('50% 50%') }).optional(),
      plataforma: z.enum(['ingresse', 'blueticket', 'outra']).optional(),
      ingresso_url: z.url().optional(),
      status: z.enum(['aberto', 'esgotado', 'em_breve', 'encerrado']),
      lotes_info: z.string().optional(),
      mesas_disponiveis: z.boolean().optional(),
      exemplo: z.boolean().default(false),
    })
    .refine((evento) => evento.status !== 'aberto' || Boolean(evento.ingresso_url && evento.plataforma), {
      message: 'Evento aberto precisa de plataforma e ingresso_url',
    }),
});

export const collections = { eventos };
