export type SystemLanguage = 'en' | 'pt' | 'tl';

export const dictionaries = {
    en: {
        messages: {
            welcome: "Welcome to DailyWord! 🕊️\nYou will receive a notification when today's word is ready.\nReply STOP to unsubscribe.",
            notRegistered: "It looks like this number isn't registered yet.",
            replyAmen: "You’re welcome to respond with 🙏 Amen or share a reflection.",
            unsubscribed: "You have been unsubscribed. God bless!",
            resumed: "Messages Activated! 🕊️\n\nYour daily readings will continue arriving at your scheduled time.",
            readingHeader: "Daily Readings for",
            reading1: "Reading 1",
            psalm: "Psalm",
            reading2: "Reading 2",
            gospel: "Gospel",
            readFull: "Read full",
            errorInit: "Sorry, I couldn't fetch the readings. Please try again later.",
            reflectionNotReady: "Today's reflection is not ready yet. Please check back shortly!",
        },
        ui: {
            settingsTitle: "User Settings",
            save: "Save Settings",
            saving: "Saving...",
            saved: "Settings saved successfully!",
            systemLanguage: "System Language",
            bibleVersion: "Bible Version",
            deliveryTime: "Delivery Time (Local)",
            timezone: "Timezone",
            whatsappConnection: "WhatsApp Connection",
            verify: "Verify",
            verified: "Verified",
            pause: "Pause Messages",
            resume: "Activate on WhatsApp",
            enterPhone: "Enter phone number",
            confirm: "Confirm",
            resend: "Resend Code",
        },
        landing: {
            nav: {
                features: "Features",
                pricing: "Pricing",
                login: "Login",
                getStarted: "Get Started"
            },
            hero: {
                badge: "The First Automated WhatsApp Daily Bible Reading",
                headline: "Daily Grace,",
                subheadline: "Delivered.",
                description: "Start your morning with purpose. Receive a hand-picked, spiritually uplifting Bible verse or reading directly to your WhatsApp every day.",
                ctaPrimary: "Start For Free",
                ctaSecondary: "How it Works",
                benefits: ["Cancel Anytime", "7-Day Free Trial", "No Credit Card Required", "Instant Setup"]
            },
            howItWorks: {
                title: "Start Your Journey in 3 Simple Steps",
                subtitle: "Join thousands of believers who have made Scripture a daily habit.",
                step1: { title: "Sign Up", desc: "Start your 7-day free trial. No credit card required. Cancel anytime. Choose your preferred delivery time." },
                step2: { title: "Receive", desc: "Get a daily WhatsApp message with the Gospel, a reflection, and a prayer — right when you need it." },
                step3: { title: "Reflect", desc: "Read in your private chat. Reply with 'Amen' or your own prayer to build a spiritual journal." }
            },
            pricing: {
                title: "Simple, Transparent Pricing",
                monthly: { title: "Monthly", price: "$2.99", unit: "/mo", cta: "Start 7-Day Trial" },
                yearly: { title: "Yearly", price: "$24.99", unit: "/yr", cta: "Start Yearly Plan", badge: "BEST VALUE", save: "Save 30% vs Monthly" },
                features: ["Daily WhatsApp Messages", "Custom Delivery Time", "Lectionary or Daily Verses", "Priority Support"]
            },
            faq: {
                title: "Frequently Asked Questions",
                subtitle: "Everything you need to know about DailyWord.",
                q1: "Is this really daily?", a1: "Yes! Every single morning at your chosen time, we send you the daily readings directly to your WhatsApp.",
                q2: "Which Bible version do you use?", a2: "We primarily use the NABRE (Catholic) but support other versions like Tagalog (Ang Biblia) and Portuguese (Almeida).",
                q3: "Can I cancel anytime?", a3: "Absolutely. You can manage your subscription directly from your dashboard. There are no long-term contracts.",
                q4: "Is my phone number safe?", a4: "Your privacy is our priority. We ensure delivery via secure official APIs and never share your number.",
                q5: "Do you support other timezones?", a5: "Yes! You can set your preferred delivery time in your local timezone.",
                q6: "Why is there a cost?", a6: "The subscription covers WhatsApp messaging fees and server costs to keep the service reliable and ad-free."
            },
            footer: {
                description: "Bringing the Word of God to your daily life through technology.",
                links: ["Features", "Pricing", "How it Works", "FAQ", "Privacy Policy", "Terms of Service", "Contact"]
            }
        }
    },
    pt: {
        messages: {
            welcome: "Bem-vindo ao DailyWord! 🕊️\nVocê receberá uma notificação quando a palavra de hoje estiver pronta.\nResponda PARAR para cancelar a assinatura.",
            notRegistered: "Parece que este número ainda não está registrado.",
            replyAmen: "Sinta-se à vontade para responder com 🙏 Amém ou compartilhar uma reflexão.",
            unsubscribed: "Sua assinatura foi cancelada. Deus te abençoe!",
            resumed: "Mensagens Ativadas! 🕊️\n\nSuas leituras diárias continuarão chegando no horário agendado.",
            readingHeader: "Leituras Diárias para",
            reading1: "1ª Leitura",
            psalm: "Salmo",
            reading2: "2ª Leitura",
            gospel: "Evangelho",
            readFull: "Leia completo",
            errorInit: "Desculpe, não consegui buscar as leituras agora. Por favor, tente novamente mais tarde.",
            reflectionNotReady: "A reflexão de hoje ainda não está pronta. Por favor, verifique novamente em breve!",
        },
        ui: {
            settingsTitle: "Configurações do Usuário",
            save: "Salvar Configurações",
            saving: "Salvando...",
            saved: "Configurações salvas com sucesso!",
            systemLanguage: "Idioma do Sistema",
            bibleVersion: "Versão da Bíblia",
            deliveryTime: "Horário de Envio (Local)",
            timezone: "Fuso Horário",
            whatsappConnection: "Conexão WhatsApp",
            verify: "Verificar",
            verified: "Verificado",
            pause: "Pausar Mensagens",
            resume: "Ativar no WhatsApp",
            enterPhone: "Digite o número de telefone",
            confirm: "Confirmar",
            resend: "Reenviar Código",
        },
        landing: {
            nav: {
                features: "Recursos",
                pricing: "Preços",
                login: "Entrar",
                getStarted: "Começar"
            },
            hero: {
                badge: "A Primeira Leitura Diária da Bíblia Automatizada no WhatsApp",
                headline: "Graça Diária,",
                subheadline: "Entregue.",
                description: "Comece sua manhã com propósito. Receba uma palavra bíblica edificante diretamente no seu WhatsApp todos os dias.",
                ctaPrimary: "Começar Grátis",
                ctaSecondary: "Como Funciona",
                benefits: ["Cancele a Qualquer Momento", "7 Dias Grátis", "Sem Cartão de Crédito", "Instalação Instantânea"]
            },
            howItWorks: {
                title: "Comece sua Jornada em 3 Passos Simples",
                subtitle: "Junte-se a milhares de fiéis que fizeram das Escrituras um hábito diário.",
                step1: { title: "Inscreva-se", desc: "Inicie seu teste grátis de 7 dias. Sem cartão de crédito. Cancele quando quiser." },
                step2: { title: "Receba", desc: "Receba uma mensagem diária no WhatsApp com o Evangelho, uma reflexão e uma oração." },
                step3: { title: "Reflita", desc: "Leia em seu chat privado. Responda com 'Amém' ou sua própria oração para criar um diário espiritual." }
            },
            pricing: {
                title: "Preços Simples e Transparentes",
                monthly: { title: "Mensal", price: "R$ 15,90", unit: "/mês", cta: "Teste Grátis 7 Dias" },
                yearly: { title: "Anual", price: "R$ 129,90", unit: "/ano", cta: "Plano Anual", badge: "MELHOR VALOR", save: "Economize 30%" },
                features: ["Mensagens Diárias no WhatsApp", "Horário Personalizado", "Liturgia ou Versículos", "Suporte Prioritário"]
            },
            faq: {
                title: "Perguntas Frequentes",
                subtitle: "Tudo o que você precisa saber sobre o DailyWord.",
                q1: "É realmente diário?", a1: "Sim! Todas as manhãs, no horário escolhido, enviamos as leituras diretamente para seu WhatsApp.",
                q2: "Qual versão da Bíblia vocês usam?", a2: "Suportamos várias versões, incluindo Almeida (Português), NABRE (Inglês) e Ang Biblia (Tagalog).",
                q3: "Posso cancelar a qualquer momento?", a3: "Com certeza. Você pode gerenciar sua assinatura diretamente no painel. Sem contratos longos.",
                q4: "Meu número de telefone está seguro?", a4: "Sua privacidade é nossa prioridade. Usamos a API oficial segura e nunca compartilhamos seu número.",
                q5: "Vocês suportam outros fusos horários?", a5: "Sim! Você pode definir seu horário de envio preferido no seu fuso horário local.",
                q6: "Por que há um custo?", a6: "A assinatura cobre os custos de mensagens do WhatsApp e servidores para manter o serviço confiável e sem anúncios."
            },
            footer: {
                description: "Levando a Palavra de Deus para sua vida diária através da tecnologia.",
                links: ["Recursos", "Preços", "Como Funciona", "FAQ", "Política de Privacidade", "Termos de Serviço", "Contato"]
            }
        }
    },
    tl: {
        messages: {
            welcome: "Maligayang pagdating sa DailyWord! 🕊️\nMakakatanggap ka ng abiso kapag handa na ang salita ngayong araw.\nSumagot ng STOP upang mag-unsubscribe.",
            notRegistered: "Mukhang hindi pa nakarehistro ang numerong ito.",
            replyAmen: "Maaari kang sumagot ng 🙏 Amen o magbahagi ng pagninilay.",
            unsubscribed: "Ikaw ay naka-unsubscribe na. Pagpalain ka ng Diyos!",
            resumed: "Aktibo na ang mga Mensahe! 🕊️\n\nAng iyong pang-araw-araw na pagbasa ay darating sa iyong itinakdang oras.",
            readingHeader: "Pang-araw-araw na Pagbasa para sa",
            reading1: "Unang Pagbasa",
            psalm: "Salmo",
            reading2: "Ikalawang Pagbasa",
            gospel: "Ebanghelyo",
            readFull: "Basahin ang buong detalye",
            errorInit: "Paumanhin, hindi ko makuha ang mga pagbasa ngayon. Pakisubukan muli mamaya.",
            reflectionNotReady: "Ang pagninilay ngayong araw ay hindi pa handa. Pakitingnan muli mamaya!",
        },
        ui: {
            settingsTitle: "Mga Setting ng User",
            save: "I-save ang mga Setting",
            saving: "Nag-i-save...",
            saved: "Matagumpay na na-save ang mga setting!",
            systemLanguage: "Wika ng Sistema",
            bibleVersion: "Bersyon ng Bibliya",
            deliveryTime: "Oras ng Pagpapadala (Lokal)",
            timezone: "Timezone",
            whatsappConnection: "Koneksyon sa WhatsApp",
            verify: "I-verify",
            verified: "Beripikado",
            pause: "I-pause ang mga Mensahe",
            resume: "I-activate sa WhatsApp",
            enterPhone: "Ilagay ang numero ng telepono",
            confirm: "Kumpirmahin",
            resend: "Ipadala Muli ang Code",
        },
        landing: {
            nav: {
                features: "Mga Tampok",
                pricing: "Presyo",
                login: "Mag-login",
                getStarted: "Magsimula"
            },
            hero: {
                badge: "Ang Unang Automated WhatsApp Daily Bible Reading",
                headline: "Pang-araw-araw na Biyaya,",
                subheadline: "Ipinadala.",
                description: "Simulan ang iyong umaga nang may layunin. Tanggapin ang Salita ng Diyos direkta sa iyong WhatsApp araw-araw.",
                ctaPrimary: "Magsimula nang Libre",
                ctaSecondary: "Paano Ito Gumagana",
                benefits: ["Kanselahin Anumang Oras", "7-Araw na Libreng Pagsubok", "Walang Credit Card", "Mabilis na Setup"]
            },
            howItWorks: {
                title: "Simulan ang Iyong Paglalakbay sa 3 Simpleng Hakbang",
                subtitle: "Sumali sa libu-libong mananampalataya na ginawang ugali ang pagbabasa ng Banal na Kasulatan.",
                step1: { title: "Mag-sign Up", desc: "Simulan ang iyong 7-araw na libreng pagsubok. Walang credit card. Kanselahin anumang oras." },
                step2: { title: "Tanggapin", desc: "Makakuha ng pang-araw-araw na mensahe sa WhatsApp na may Ebanghelyo, pagninilay, at panalangin." },
                step3: { title: "Magnilay", desc: "Basahin sa iyong pribadong chat. Sumagot ng 'Amen' o iyong sariling panalangin." }
            },
            pricing: {
                title: "Simple at Malinaw na Presyo",
                monthly: { title: "Buwanan", price: "₱ 150", unit: "/buwan", cta: "Simulan ang 7-Araw na Pagsubok" },
                yearly: { title: "Taunan", price: "₱ 1,250", unit: "/taon", cta: "Taunang Plano", badge: "SULIT NA VALUE", save: "Makatipid ng 30%" },
                features: ["Pang-araw-araw na Mensahe", "Sariling Oras ng Pagpadala", "Lectionary o Daily Verses", "Priority Support"]
            },
            faq: {
                title: "Mga Madalas Itanong",
                subtitle: "Lahat ng kailangan mong malaman tungkol sa DailyWord.",
                q1: "Talaga bang araw-araw ito?", a1: "Oo! Tuwing umaga sa iyong napiling oras, ipapadala namin ang mga pagbasa direkta sa iyong WhatsApp.",
                q2: "Anong bersyon ng Bibliya ang gamit niyo?", a2: "Pangunahing gamit namin ang NABRE (Catholic) ngunit mayroon ding Tagalog (Ang Biblia) at Portuguese (Almeida).",
                q3: "Pwede bang mag-cancel kahit kailan?", a3: "Oo naman. Maaari mong pamahalaan ang iyong subscription sa dashboard. Walang kontrata.",
                q4: "Ligtas ba ang aking numero?", a4: "Ang iyong privacy ay mahalaga. Gumagamit kami ng opisyal na secure API at hindi ibinabahagi ang iyong numero.",
                q5: "Mayroon ba kayong ibang timezone?", a5: "Oo! Maaari mong itakda ang iyong oras ng pagpapadala sa iyong lokal na timezone.",
                q6: "Bakit may bayad?", a6: "Ang subscription ay para sa mga gastusin sa WhatsApp messaging at servers upang mapanatiling maayos at walang ads ang serbisyo."
            },
            footer: {
                description: "Dinadala ang Salita ng Diyos sa iyong pang-araw-araw na buhay gamit ang teknolohiya.",
                links: ["Mga Tampok", "Presyo", "Paano Ito Gumagana", "FAQ", "Patakaran sa Privacy", "Mga Tuntunin", "Makipag-ugnayan"]
            }
        }
    }
} as const;
