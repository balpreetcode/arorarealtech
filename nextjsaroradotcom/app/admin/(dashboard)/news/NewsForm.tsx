import type { CSSProperties, ReactNode } from 'react';

export interface NewsFormValues {
  title?: string;
  slug?: string;
  summary?: string | null;
  bodyHtml?: string | null;
  imageUrl?: string | null;
  author?: string | null;
  published?: boolean;
}

interface NewsFormProps {
  action: (formData: FormData) => Promise<void>;
  initialValues?: NewsFormValues;
  submitLabel: string;
  cancelHref: string;
  errorMessage?: string | null;
  children?: ReactNode;
}

export function NewsForm({
  action,
  initialValues,
  submitLabel,
  cancelHref,
  errorMessage,
  children,
}: NewsFormProps) {
  return (
    <form action={action} style={formStyle}>
      {children}

      {errorMessage && <div style={errorBannerStyle}>{errorMessage}</div>}

      <label style={labelStyle}>
        Title
        <input
          type="text"
          name="title"
          defaultValue={initialValues?.title || ''}
          required
          style={inputStyle}
        />
      </label>

      <label style={labelStyle}>
        Slug
        <input
          type="text"
          name="slug"
          placeholder="Will be generated from title if empty"
          defaultValue={initialValues?.slug || ''}
          style={inputStyle}
        />
      </label>

      <label style={labelStyle}>
        Summary
        <textarea
          name="summary"
          defaultValue={initialValues?.summary || ''}
          rows={3}
          style={textareaStyle}
        />
      </label>

      <label style={labelStyle}>
        Body HTML
        <textarea
          name="bodyHtml"
          defaultValue={initialValues?.bodyHtml || ''}
          rows={12}
          style={textareaStyle}
        />
        <span style={helperTextStyle}>
          Supports HTML pasted from Drupal. Use semantic headings where possible.
        </span>
      </label>

      <div style={gridStyle}>
        <label style={labelStyle}>
          Featured image URL
          <input
            type="text"
            name="imageUrl"
            defaultValue={initialValues?.imageUrl || ''}
            placeholder="https://example.com/image.jpg"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Author
          <input
            type="text"
            name="author"
            defaultValue={initialValues?.author || ''}
            placeholder="Author name (optional)"
            style={inputStyle}
          />
        </label>
      </div>

      <label style={labelStyle}>
        Status
        <select
          name="published"
          defaultValue={initialValues?.published === false ? 'draft' : 'published'}
          style={inputStyle}
        >
          <option value="published">Published (visible)</option>
          <option value="draft">Draft (hidden)</option>
        </select>
      </label>

      <div style={buttonRowStyle}>
        <button type="submit" style={primaryButtonStyle}>
          {submitLabel}
        </button>
        <a href={cancelHref} style={secondaryButtonStyle}>
          Cancel
        </a>
      </div>
    </form>
  );
}

const formStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
  backgroundColor: '#fff',
  padding: '1.5rem',
  border: '1px solid #cbd5f5',
  borderRadius: '8px',
};

const labelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
  fontWeight: 600,
  color: '#0f172a',
};

const inputStyle: CSSProperties = {
  padding: '0.65rem',
  borderRadius: '4px',
  border: '1px solid #cbd5f5',
  fontWeight: 500,
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: '140px',
  fontFamily: 'monospace',
};

const helperTextStyle: CSSProperties = {
  fontWeight: 400,
  fontSize: '0.85rem',
  color: '#475569',
};

const buttonRowStyle: CSSProperties = {
  display: 'flex',
  gap: '1rem',
};

const primaryButtonStyle: CSSProperties = {
  padding: '0.75rem 1.5rem',
  backgroundColor: '#0f172a',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 600,
};

const secondaryButtonStyle: CSSProperties = {
  padding: '0.75rem 1.5rem',
  backgroundColor: '#e2e8f0',
  color: '#0f172a',
  borderRadius: '4px',
  textDecoration: 'none',
  fontWeight: 600,
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '1rem',
};

const errorBannerStyle: CSSProperties = {
  backgroundColor: '#fee2e2',
  color: '#b3261e',
  padding: '0.75rem 1rem',
  borderRadius: '6px',
  border: '1px solid #fca5a5',
};
