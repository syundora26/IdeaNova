import type { ComponentProps } from 'react';
import { AuthPage as OriginalAuth, AccountPage as OriginalAccount } from '../MemberPages';
import { InquiryPage as OriginalInquiry } from '../InquiryPage';
function PreviewNotice() { return <div className="container"><p className="notice" role="note">デザイン確認用サイトです。登録・注文・送信はできません。入力する場合は架空の内容でご確認ください。</p></div>; }
export function AuthPage(props: ComponentProps<typeof OriginalAuth>) { return <><PreviewNotice /><OriginalAuth {...props} /></>; }
export function AccountPage() { return <><PreviewNotice /><OriginalAccount /></>; }
export function InquiryPage(props: ComponentProps<typeof OriginalInquiry>) { return <><PreviewNotice /><OriginalInquiry {...props} /></>; }
