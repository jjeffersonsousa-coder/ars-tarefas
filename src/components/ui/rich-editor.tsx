'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { cn } from '@/lib/utils'
import { Bold, Italic, List, ListOrdered, Link2, Heading2, Undo, Redo } from 'lucide-react'

interface RichEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
}

export function RichEditor({ value, onChange, placeholder = 'Escreva aqui...', className, minHeight = '150px' }: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-violet-600 underline hover:text-violet-800' } }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: 'prose prose-sm max-w-none focus:outline-none text-gray-800 leading-relaxed' },
    },
  })

  if (!editor) return null

  const ToolBtn = ({ onClick, active, title, children }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'p-1.5 rounded-lg transition-colors text-gray-500 hover:text-gray-900 hover:bg-gray-100',
        active && 'bg-violet-100 text-violet-700'
      )}
    >
      {children}
    </button>
  )

  return (
    <div className={cn('border border-gray-200 rounded-xl overflow-hidden bg-white', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-gray-100 bg-gray-50">
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Negrito">
          <Bold className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Itálico">
          <Italic className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Título">
          <Heading2 className="h-3.5 w-3.5" />
        </ToolBtn>
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista">
          <List className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerada">
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolBtn>
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <ToolBtn
          onClick={() => {
            const url = window.prompt('URL:')
            if (url) editor.chain().focus().setLink({ href: url }).run()
          }}
          active={editor.isActive('link')}
          title="Link"
        >
          <Link2 className="h-3.5 w-3.5" />
        </ToolBtn>
        <div className="flex-1" />
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Desfazer">
          <Undo className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Refazer">
          <Redo className="h-3.5 w-3.5" />
        </ToolBtn>
      </div>
      {/* Editor area */}
      <div className="px-4 py-3" style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
