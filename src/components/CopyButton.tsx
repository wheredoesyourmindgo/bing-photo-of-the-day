'use client'

import {useState} from 'react'
import {CopyButton as BaseCopyButton} from '@/components/animate-ui/components/buttons/copy'
import {cn} from '@/lib/utils'

type CopyButtonProps = React.ComponentProps<typeof BaseCopyButton>

function CopyButton({className, onCopiedChange, ...props}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  return (
    <BaseCopyButton
      className={cn(
        'duration-[250ms]',
        copied && 'text-green-600 hover:text-green-600',
        className
      )}
      onCopiedChange={(isCopied, content) => {
        setCopied(isCopied)
        onCopiedChange?.(isCopied, content)
      }}
      {...props}
    />
  )
}

export {CopyButton}
