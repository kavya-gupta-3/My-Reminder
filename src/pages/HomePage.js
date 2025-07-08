import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { 
  FaBirthdayCake, 
  FaRobot, 
  FaBell, 
  FaMobile, 
  FaUsers, 
  FaHeart,
  FaPlay,
  FaCheckCircle,
  FaStar,
  FaQuoteLeft,
  FaGithub,
  FaChevronDown,
  FaCalendarAlt,
  FaShare,
  FaPalette,
  FaLock,
  FaRocket
} from 'react-icons/fa';

function HomePage() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const features = [
    {
      icon: <FaRobot />,
      title: "AI-Powered Messages",
      description: "Generate personalized birthday messages using advanced AI that understands relationships and creates heartfelt content."
    },
    {
      icon: <FaBell />,
      title: "Smart Notifications",
      description: "Never miss a birthday with intelligent reminders sent at perfect times - 1 week, 1 day, 6 hours, and 1 hour before."
    },
    {
      icon: <FaMobile />,
      title: "Progressive Web App",
      description: "Install on any device and enjoy native app experience with offline support and home screen access."
    },
    {
      icon: <FaUsers />,
      title: "Relationship-Aware",
      description: "Messages adapt to your relationship - family, friends, colleagues, or romantic partners get appropriately toned messages."
    },
    {
      icon: <FaShare />,
      title: "Easy Sharing",
      description: "Share birthday messages instantly via WhatsApp, email, SMS, or copy to clipboard with one click."
    },
    {
      icon: <FaPalette />,
      title: "Beautiful Design",
      description: "Modern, responsive interface that looks stunning on mobile, tablet, and desktop with intuitive navigation."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Busy Professional",
      message: "This app has saved me so many times! The AI messages are so thoughtful, nobody can tell they're generated.",
      rating: 5
    },
    {
      name: "Mike Chen",
      role: "Family Man",
      message: "Finally, I never forget my family's birthdays. The notifications are perfectly timed and the messages feel personal.",
      rating: 5
    },
    {
      name: "Emma Williams",
      role: "Social Butterfly",
      message: "Managing 50+ friends' birthdays was impossible before this. Now I'm the friend who always remembers!",
      rating: 5
    }
  ];

  const stats = [
    { number: "10K+", label: "Happy Users" },
    { number: "50K+", label: "Birthdays Remembered" },
    { number: "99.9%", label: "Uptime" },
    { number: "4.9/5", label: "User Rating" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const scrollToFeatures = () => {
    document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      lineHeight: 1.6,
      color: '#333'
    }}>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated Background Elements */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '60px',
          height: '60px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '15%',
          width: '40px',
          height: '40px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          animation: 'float 4s ease-in-out infinite reverse'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '15%',
          left: '20%',
          width: '80px',
          height: '80px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite'
        }} />

        <div style={{
          maxWidth: '800px',
          padding: '0 20px',
          zIndex: 2
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '24px',
            animation: 'bounce 2s infinite'
          }}>
            🎂
          </div>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: '700',
            marginBottom: '24px',
            textShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}>
            Birthday Remind
          </h1>
          <p style={{
            fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)',
            marginBottom: '40px',
            opacity: 0.9,
            fontWeight: '300'
          }}>
            Never miss a special day again with AI-powered birthday reminders
          </p>
          <div style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '60px'
          }}>
            <button
              onClick={handleGetStarted}
              style={{
                background: '#fff',
                color: '#667eea',
                border: 'none',
                padding: '16px 32px',
                borderRadius: '50px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)';
              }}
            >
              <FaRocket /> Get Started Free
            </button>
            <button
              onClick={scrollToFeatures}
              style={{
                background: 'transparent',
                color: '#fff',
                border: '2px solid rgba(255,255,255,0.3)',
                padding: '16px 32px',
                borderRadius: '50px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.1)';
                e.target.style.borderColor = 'rgba(255,255,255,0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.borderColor = 'rgba(255,255,255,0.3)';
              }}
            >
              <FaPlay /> Learn More
            </button>
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '30px',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            {stats.map((stat, index) => (
              <div key={index} style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  marginBottom: '8px'
                }}>
                  {stat.number}
                </div>
                <div style={{
                  fontSize: '0.9rem',
                  opacity: 0.8
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div 
          onClick={scrollToFeatures}
          style={{
            position: 'absolute',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            cursor: 'pointer',
            animation: 'bounce 2s infinite',
            opacity: 0.7
          }}
        >
          <FaChevronDown size={24} />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{
        padding: '100px 20px',
        background: '#f8f9fa'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: '700',
              marginBottom: '20px',
              color: '#000'
            }}>
              Powerful Features
            </h2>
            <p style={{
              fontSize: '1.2rem',
              color: '#666',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Everything you need to never miss another birthday, powered by cutting-edge AI technology
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '40px'
          }}>
            {features.map((feature, index) => (
              <div
                key={index}
                style={{
                  background: '#fff',
                  padding: '40px',
                  borderRadius: '20px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                  border: '2px solid transparent',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.12)';
                  e.currentTarget.style.borderColor = '#667eea';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.08)';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <div style={{
                  fontSize: '3rem',
                  color: '#667eea',
                  marginBottom: '20px'
                }}>
                  {feature.icon}
                </div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  marginBottom: '16px',
                  color: '#000'
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  color: '#666',
                  lineHeight: '1.6'
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{
        padding: '100px 20px',
        background: '#fff'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: '700',
              marginBottom: '20px',
              color: '#000'
            }}>
              How It Works
            </h2>
            <p style={{
              fontSize: '1.2rem',
              color: '#666',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Get started in minutes with our simple 3-step process
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '60px',
            alignItems: 'center'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                color: '#fff',
                margin: '0 auto 24px auto',
                fontWeight: '700'
              }}>
                1
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                marginBottom: '16px',
                color: '#000'
              }}>
                Add Birthdays
              </h3>
              <p style={{
                color: '#666',
                lineHeight: '1.6'
              }}>
                Simply chat with our AI assistant to add birthdays. Just tell us the name, date, and relationship.
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                color: '#fff',
                margin: '0 auto 24px auto',
                fontWeight: '700'
              }}>
                2
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                marginBottom: '16px',
                color: '#000'
              }}>
                Get Notified
              </h3>
              <p style={{
                color: '#666',
                lineHeight: '1.6'
              }}>
                Receive smart notifications at the perfect times - never too early, never too late.
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                color: '#fff',
                margin: '0 auto 24px auto',
                fontWeight: '700'
              }}>
                3
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                marginBottom: '16px',
                color: '#000'
              }}>
                Share & Celebrate
              </h3>
              <p style={{
                color: '#666',
                lineHeight: '1.6'
              }}>
                Use AI-generated personalized messages or create your own. Share instantly via any platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section style={{
        padding: '100px 20px',
        background: '#f8f9fa'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: '700',
            marginBottom: '20px',
            color: '#000'
          }}>
            What Our Users Say
          </h2>
          <p style={{
            fontSize: '1.2rem',
            color: '#666',
            marginBottom: '60px'
          }}>
            Join thousands of happy users who never miss a birthday
          </p>

          <div style={{
            background: '#fff',
            padding: '60px 40px',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            position: 'relative',
            minHeight: '200px'
          }}>
            <FaQuoteLeft style={{
              fontSize: '3rem',
              color: '#667eea',
              opacity: 0.3,
              position: 'absolute',
              top: '20px',
              left: '20px'
            }} />
            
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                <FaStar key={i} style={{ color: '#ffc107', fontSize: '1.2rem', marginRight: '4px' }} />
              ))}
            </div>

            <p style={{
              fontSize: '1.3rem',
              fontStyle: 'italic',
              marginBottom: '30px',
              color: '#333',
              lineHeight: '1.6'
            }}>
              "{testimonials[currentTestimonial].message}"
            </p>

            <div>
              <h4 style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                marginBottom: '4px',
                color: '#000'
              }}>
                {testimonials[currentTestimonial].name}
              </h4>
              <p style={{
                color: '#666',
                fontSize: '0.9rem'
              }}>
                {testimonials[currentTestimonial].role}
              </p>
            </div>

            {/* Testimonial Dots */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '30px'
            }}>
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    border: 'none',
                    background: index === currentTestimonial ? '#667eea' : '#ddd',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '100px 20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '24px'
          }}>
            🎉
          </div>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: '700',
            marginBottom: '24px'
          }}>
            Ready to Get Started?
          </h2>
          <p style={{
            fontSize: '1.2rem',
            marginBottom: '40px',
            opacity: 0.9
          }}>
            Join thousands of users who never miss a birthday. Start creating meaningful connections today.
          </p>
          <button
            onClick={handleGetStarted}
            style={{
              background: '#fff',
              color: '#667eea',
              border: 'none',
              padding: '20px 40px',
              borderRadius: '50px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-4px)';
              e.target.style.boxShadow = '0 16px 48px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)';
            }}
          >
            <FaBirthdayCake /> Start Free Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#000',
        color: '#fff',
        padding: '60px 20px 40px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '30px',
            gap: '16px'
          }}>
            <FaBirthdayCake style={{ fontSize: '2rem', color: '#667eea' }} />
            <h3 style={{
              fontSize: '1.8rem',
              fontWeight: '700',
              margin: 0
            }}>
              Birthday Remind
            </h3>
          </div>
          
          <p style={{
            color: '#ccc',
            marginBottom: '30px',
            fontSize: '1.1rem'
          }}>
            Never miss a special day again
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '30px',
            flexWrap: 'wrap',
            marginBottom: '40px'
          }}>
            <a href="#features" style={{ color: '#ccc', textDecoration: 'none', fontSize: '1rem' }}>Features</a>
            <a href="#" style={{ color: '#ccc', textDecoration: 'none', fontSize: '1rem' }}>Privacy</a>
            <a href="#" style={{ color: '#ccc', textDecoration: 'none', fontSize: '1rem' }}>Terms</a>
            <a href="#" style={{ color: '#ccc', textDecoration: 'none', fontSize: '1rem' }}>Support</a>
          </div>

          <div style={{
            borderTop: '1px solid #333',
            paddingTop: '30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <p style={{
              color: '#666',
              margin: 0,
              fontSize: '0.9rem'
            }}>
              © 2024 Birthday Remind. All rights reserved.
            </p>
            <div style={{
              display: 'flex',
              gap: '20px',
              alignItems: 'center'
            }}>
              <a 
                href="https://github.com/kavya-gupta-3/Birthday-Reminder" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  color: '#ccc',
                  fontSize: '1.5rem',
                  transition: 'color 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = '#667eea'}
                onMouseLeave={(e) => e.target.style.color = '#ccc'}
              >
                <FaGithub />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes bounce {
          0%, 20%, 60%, 100% { transform: translateY(0); }
          40%, 80% { transform: translateY(-10px); }
        }
        @media (max-width: 768px) {
          .hero-buttons {
            flex-direction: column;
            align-items: center;
          }
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
          .features-grid {
            grid-template-columns: 1fr;
          }
          .how-it-works-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
        }
      `}</style>
    </div>
  );
}

export default HomePage; 