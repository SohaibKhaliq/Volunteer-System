import { Monitor, Mail, ShieldAlert, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface MaintenanceLockProps {
    message?: string;
    supportEmail?: string;
    platformName?: string;
}

export default function MaintenanceLock({
    message = "We're currently performing some scheduled maintenance to improve your experience. We'll be back online shortly.",
    supportEmail = "support@eghata.gov.au",
    platformName = "Volunteer System"
}: MaintenanceLockProps) {
    return (
        <div className="fixed inset-0 z-[200] bg-slate-50 flex items-center justify-center p-4 overflow-auto">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <Card className="w-full max-w-2xl shadow-2xl border-none bg-white/80 backdrop-blur-xl relative z-10">
                <CardHeader className="text-center pt-12">
                    <div className="mx-auto w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center mb-8 rotate-3 transition-transform hover:rotate-0">
                        <Monitor className="w-12 h-12 text-primary" />
                        <div className="absolute -top-2 -right-2 bg-amber-500 rounded-full p-2 shadow-lg animate-bounce">
                            <ShieldAlert className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
                        System Maintenance
                    </CardTitle>
                    <CardDescription className="text-lg text-slate-500 max-w-md mx-auto">
                        {platformName} is undergoing improvements
                    </CardDescription>
                </CardHeader>

                <CardContent className="px-8 pb-8 text-center space-y-8">
                    <div className="bg-slate-100/50 rounded-2xl p-6 border border-slate-200">
                        <p className="text-slate-700 leading-relaxed text-lg italic">
                            "{message}"
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                        <div className="flex items-start gap-4 p-4 rounded-xl bg-white shadow-sm border border-slate-100">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                <Clock className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-900">Estimated Time</h4>
                                <p className="text-sm text-slate-500">Checking back in 1-2 hours is recommended.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-xl bg-white shadow-sm border border-slate-100">
                            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                                <RefreshCw className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-900">Live Updates</h4>
                                <p className="text-sm text-slate-500">Refresh the page to see if we're back.</p>
                            </div>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-6 items-center border-t border-slate-100 pt-8 bg-slate-50/50 rounded-b-2xl">
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-sm text-slate-400 uppercase tracking-widest font-bold">Need Urgent Support?</p>
                        <Button variant="outline" className="rounded-full gap-2 px-6 h-12 hover:bg-white hover:shadow-md transition-all font-medium" asChild>
                            <a href={`mailto:${supportEmail}`}>
                                <Mail className="w-4 h-4" />
                                Contact {supportEmail}
                            </a>
                        </Button>
                    </div>

                    <p className="text-xs text-slate-400 pb-4">
                        Thank you for your patience and for being part of our community.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
