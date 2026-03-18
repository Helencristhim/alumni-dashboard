'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import UnderlineExtension from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
import { useEffect, useCallback } from 'react';
import { EditorToolbar } from './EditorToolbar';

// Logo Alumni fixo - nunca muda
const ALUMNI_LOGO_URL = '/logos/alumni-by-better.png';

interface ContractEditorProps {
  content: string;
  onChange: (html: string) => void;
  editable?: boolean;
  brand?: string;
  logoUrl?: string;
}

// Papel timbrado fixo Alumni - header
function AlumniLetterheadHeader() {
  return (
    <div style={{ pointerEvents: 'none', userSelect: 'none' }}>
      {/* Logo topo centralizado */}
      <div style={{ textAlign: 'center', paddingTop: 28, paddingBottom: 14 }}>
        <img
          src={ALUMNI_LOGO_URL}
          alt="Alumni by Better"
          style={{ height: 56, objectFit: 'contain', margin: '0 auto' }}
        />
      </div>
      {/* Linha vermelha superior */}
      <div style={{ margin: '0 20px', height: 2, backgroundColor: '#D42027' }} />
    </div>
  );
}

// Papel timbrado fixo Alumni - footer
function AlumniLetterheadFooter() {
  return (
    <div style={{ pointerEvents: 'none', userSelect: 'none', marginTop: 40 }}>
      {/* Linha vermelha inferior */}
      <div style={{ margin: '0 20px', height: 2, backgroundColor: '#D42027' }} />
      {/* Logo rodapé à direita */}
      <div style={{ textAlign: 'right', padding: '10px 24px 20px' }}>
        <img
          src={ALUMNI_LOGO_URL}
          alt="Alumni by Better"
          style={{ height: 36, objectFit: 'contain', display: 'inline-block' }}
        />
      </div>
    </div>
  );
}

export function ContractEditor({
  content,
  onChange,
  editable = true,
  brand,
}: ContractEditorProps) {
  const isAlumni = brand === 'alumni';

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: 'Comece a editar o contrato...',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      UnderlineExtension,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Image,
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose max-w-none focus:outline-none min-h-[600px] px-12 py-8',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  // Atualizar conteúdo quando muda externamente
  const updateContent = useCallback(
    (newContent: string) => {
      if (editor && newContent !== editor.getHTML()) {
        editor.commands.setContent(newContent, { emitUpdate: false });
      }
    },
    [editor]
  );

  useEffect(() => {
    updateContent(content);
  }, [content, updateContent]);

  // Inserir HTML na posição do cursor
  const insertHTML = useCallback(
    (html: string) => {
      if (editor) {
        editor.chain().focus().insertContent(html).run();
      }
    },
    [editor]
  );

  // Expor insertHTML via window para uso pelo painel de sugestões
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__contractEditorInsertHTML = insertHTML;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as unknown as Record<string, unknown>).__contractEditorInsertHTML;
      }
    };
  }, [insertHTML]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <EditorToolbar editor={editor} />
      <div className="flex-1 overflow-y-auto bg-gray-50 min-h-0">
        <div className="max-w-[816px] mx-auto my-6 bg-white shadow-md rounded-sm border border-gray-100">
          {/* Papel timbrado Alumni - Header fixo (não editável) */}
          {isAlumni && <AlumniLetterheadHeader />}

          {/* Área editável do contrato */}
          <EditorContent editor={editor} />

          {/* Papel timbrado Alumni - Footer fixo (não editável) */}
          {isAlumni && <AlumniLetterheadFooter />}
        </div>
      </div>
    </div>
  );
}
