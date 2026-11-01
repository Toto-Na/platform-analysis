'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'

export type QuestionDef = {
  questionVersionId: string
  text: string
  description?: string | null
  answerType: string
  isRequired: boolean
  options: Array<{ text: string; value: string }>
}

type Props = {
  question: QuestionDef
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
}

export function QuestionRenderer({ question, value, onChange, readOnly }: Props) {
  const requiredMark = question.isRequired ? <span className="text-rose-500 mr-0.5">*</span> : null

  return (
    <div className="space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <Label className="text-sm font-medium leading-relaxed cursor-pointer">
          {question.text}
          {requiredMark}
        </Label>
        {question.isRequired ? (
          <Badge variant="secondary" className="text-[10px] shrink-0">إلزامي</Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] shrink-0 text-muted-foreground">اختياري</Badge>
        )}
      </div>
      {question.description && (
        <p className="text-xs text-muted-foreground -mt-1">{question.description}</p>
      )}
      <AnswerField question={question} value={value} onChange={onChange} readOnly={readOnly} />
    </div>
  )
}

function AnswerField({ question, value, onChange, readOnly }: Props) {
  const disabled = readOnly

  switch (question.answerType) {
    case 'SHORT_TEXT':
      return (
        <Input
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="إجابة قصيرة..."
          disabled={disabled}
        />
      )
    case 'LONG_TEXT':
      return (
        <Textarea
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="اكتب إجابتك بالتفصيل..."
          rows={4}
          disabled={disabled}
          className="resize-y"
        />
      )
    case 'SINGLE_CHOICE':
    case 'YES_NO':
      return (
        <RadioGroup
          value={value ?? ''}
          onValueChange={onChange}
          disabled={disabled}
          className="grid gap-2"
        >
          {question.options.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer rounded-lg border border-border p-2.5 hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
              <RadioGroupItem value={opt.value} id={`${question.questionVersionId}-${opt.value}`} />
              <span className="text-sm">{opt.text}</span>
            </label>
          ))}
        </RadioGroup>
      )
    case 'MULTIPLE_CHOICE': {
      const selected: string[] = (() => {
        try { return value ? JSON.parse(value) : [] } catch { return [] }
      })()
      function toggle(val: string) {
        if (readOnly) return
        const next = selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]
        onChange(JSON.stringify(next))
      }
      return (
        <div className="grid gap-2">
          {question.options.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer rounded-lg border border-border p-2.5 hover:bg-muted/50 transition-colors">
              <Checkbox checked={selected.includes(opt.value)} onCheckedChange={() => toggle(opt.value)} disabled={disabled} />
              <span className="text-sm">{opt.text}</span>
            </label>
          ))}
        </div>
      )
    }
    case 'RATING_1_5': {
      const num = parseInt(value ?? '0', 10) || 0
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Slider
              value={[num]}
              min={1}
              max={5}
              step={1}
              onValueChange={(v) => onChange(String(v[0]))}
              disabled={disabled}
              className="flex-1"
            />
            <div className="w-12 text-center">
              <Badge variant="secondary" className="font-mono text-sm">{num || '-'}/5</Badge>
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground px-1">
            <span>1 ضعيف</span><span>2</span><span>3 متوسط</span><span>4</span><span>5 ممتاز</span>
          </div>
        </div>
      )
    }
    case 'RATING_LEVELS':
      return (
        <RadioGroup
          value={value ?? ''}
          onValueChange={onChange}
          disabled={disabled}
          className="grid grid-cols-2 sm:grid-cols-4 gap-2"
        >
          {question.options.map((opt) => (
            <label key={opt.value} className="flex flex-col items-center gap-1 cursor-pointer rounded-lg border border-border p-3 hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors text-center">
              <RadioGroupItem value={opt.value} id={`${question.questionVersionId}-${opt.value}`} className="sr-only" />
              <span className="text-sm font-medium">{opt.text}</span>
            </label>
          ))}
        </RadioGroup>
      )
    case 'URL':
      return (
        <Input
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com"
          dir="ltr"
          disabled={disabled}
          type="url"
        />
      )
    default:
      return <Input value={value ?? ''} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
  }
}
